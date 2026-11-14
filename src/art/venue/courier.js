// Courier hub & warehouse fixtures.
import { box, qy, qx, qz, lw, fq, glow, lit, ball, cyl, dk, lt, mix, PAT, textY, signY, spx, hash2, rng, textW } from '../../engine/raster.js';
import { F, K, bx, tube, post, posts, frameY, frameX, frameZ, table, stool, counter, monitor, goods, shelf, heap, heap2, carton, pallet, plant, compose, screenY, screenLines, keyboard, PX } from './_lib.js';
import generic from './generic.js';
const CW = ['courier', 'warehouse'], HZ = PAT.vstripes('#f2c230', '#2a2733', 3), OR = '#e8843a', BL = '#3c5a9a', CH = '#aab2ba';
const PC = ['#c99a62', '#b8854e', '#d8b07a', '#e8e0d0', '#a87848'];
/** heap of parcels inside a w x d footprint */
function parcels(x, y, z, w, d, n, seed, pal) {
  const r = rng(seed || 1), L = []; pal = pal || PC;
  for (let i = 0; i < n; i++) { const pw = .3 + r() * .3, pd = .3 + r() * .25, ph = .2 + r() * .3, px_ = x + r() * Math.max(0, w - pw), py = y + r() * Math.max(0, d - pd); L.push([px_, py, pw, pd, ph, pal[Math.floor(r() * pal.length)]]); }
  const hs = []; L.sort((a, b) => a[0] + a[1] - b[0] - b[1]).forEach((q, i) => { let zz = z; for (const o of hs) if (q[0] < o[0] + o[2] && o[0] < q[0] + q[2] && q[1] < o[1] + o[3] && o[1] < q[1] + q[3]) zz = Math.max(zz, o[4]); if (zz - z > .7) return; carton(q[0], q[1], zz, q[2], q[3], q[4], q[5], { label: i % 3 ? '#f4f0e8' : '#e8843a' }); hs.push([q[0], q[1], q[2], q[3], zz + q[4]]); });
}
const wheel = (x, y) => { spx(x, y, 0, 0, -1, '#2a2733'); spx(x, y, 0, 1, -1, '#2a2733'); spx(x, y, 0, 0, -2, '#2a2733'); spx(x, y, 0, 1, -2, '#2a2733'); };
const courier = [
  F('courier.conveyor', ['sorting_bench', 'depot_scanner', ...CW, 'sortstation', 'conveyor'], p => [p.w || 3, 1, 1], p => {
    const w = p.w || 3; for (let x = .15; x < w; x += (w - .3) / Math.ceil(w / 1.5)) { post(x, .15, 0, .7, '#5a6272'); post(x, .85, 0, .7, '#5a6272'); lw([x, .85, .3], [x, .15, .3], '#5a6272'); }
    box(0, .08, .68, w, .84, .14, BL); qz(.04, w - .04, .16, .84, .821, (x, y) => (Math.floor(x * 16) % 3 === 0) ? '#8a9098' : '#3a3f4c'); qy(0, w, .92, .68, .74, HZ);
    parcels(.2, .2, .82, w - (p.scan ? 1.6 : .5), .5, Math.round(w * 1.3), p.seed || 2);
    if (p.scan) { const x = w - .9; post(x, .08, .82, 1.7, '#5a6272'); box(x - .08, .08, 1.62, .16, .84, .12, '#3a3f4c'); lit(() => { lw([x, .14, .822], [x, .86, .822], '#ff4a4a'); spx(x, .92, 1.68, 0, 0, '#5af08a'); }); glow(() => qx(x, .14, .86, .83, 1.62, '#ff6a5a', 'glass')); post(x, .92, .82, 1.7, '#5a6272'); }
  }, { vb: p => [-.3, -.3, 0, (p.w || 3) + .3, 1.3, 2], use: { x: 1.5, y: 1.5 }, staff: { x: 1.5, y: 1.5, dir: 3 }, variants: [{ seed: 2 }, { w: 4, scan: true, seed: 5 }, { w: 2, seed: 8 }] }),

  F('courier.shelf', [...CW, 'shelf', 'parcels'], p => [p.w || 2, 1, 2.4], p => {
    const w = p.w || 2; posts(.04, .04, w - .08, .92, 0, 2.35, BL);
    for (let i = 0; i < 3; i++) { const z = .12 + i * .78; box(0, .02, z, w, .96, .06, OR, { t: '#c8a068' }); parcels(.06, .1, z + .06, w - .12, .7, Math.round(w * 2.2) - (i === 2 ? 1 : 0), (p.seed || 1) + i * 7, p.pal); }
    for (const x of [.04, w - .04]) { post(x, .96, 0, 2.35, BL); post(x + (x < 1 ? PX : -PX), .96, 0, 2.35, dk(BL, .2)); } lw([.04, .96, 2.35], [w - .04, .96, 2.35], BL);
    qy(.1, .4, .98, .13, .17, '#f4f0e8');
  }, { use: { x: 1, y: 1.5 }, variants: [{ seed: 1 }, { seed: 4, w: 3 }, { seed: 9, pal: ['#c99a62', '#d63a3a', '#3c64ad', '#f2c230', '#e8e0d0'] }] }),

  F('courier.pile', [...CW, 'parcels', 'decor'], [1, 1, 1], p => parcels(.03, .03, 0, .94, .94, p.n || 6, p.seed || 1), { variants: [{ seed: 1 }, { seed: 3, n: 4 }, { seed: 6, n: 8 }] }),

  F('courier.pallet', ['colour_pallet', ...CW, 'pallet', 'liftstation'], [1.5, 1.5, 1.5], p => {
    const k = p.kind || 'boxes', c = p.c || '#c99a62'; pallet(.1, .1, 0, 1.3, 1.3);
    if (k === 'empty') { for (let i = 1; i < (p.n || 4); i++) pallet(.1, .1, i * .13, 1.3, 1.3); return; }
    if (k === 'sacks') { for (let l = 0; l < 3; l++) for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) box(.14 + i * .62, .14 + j * .62, .13 + l * .26, .6, .6, .26, '#e8dcc0', { t: '#f1e8d0' }); return; }
    if (k === 'barrels') { for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { cyl(.45 + i * .6, .45 + j * .6, .13, .27, .85, c === '#c99a62' ? '#3c64ad' : c, { t: '#5a7ac0' }); } return; }
    for (let l = 0; l < (p.n || 3); l++) for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) carton(.14 + i * .62, .14 + j * .62, .13 + l * .4, .6, .6, .4, l % 2 ? dk(c, .06) : c, { label: p.label || '#f4f0e8' });
    const h = .13 + (p.n || 3) * .4; if (p.wrap) { qy(.14, 1.38, 1.4, .13, h, '#dff4f8', 'glass'); qx(1.4, .14, 1.38, .13, h, '#c4e2ea', 'glass'); }
    qy(.5, 1.0, 1.4, h - .4, h - .1, p.band || '#f4f0e8'); qy(.55, .95, 1.4, h - .3, h - .2, p.band ? '#f4f0e8' : '#3a3f4c');
  }, { use: { x: .75, y: 2 }, variants: [{}, { wrap: true, n: 2, band: '#d63a3a' }, { kind: 'sacks' }, { kind: 'barrels' }, { kind: 'empty' }, { c: '#e8e0d0', band: '#3c64ad', n: 3 }, { c: '#d8b07a', band: '#3fae6a', n: 2 }, { c: '#c99a62', band: '#f2c230', n: 3, wrap: true }] }),

  F('courier.palletjack', [...CW, 'vehicle', 'decor'], [1.5, .5, 1.2], p => {
    const c = p.c || '#d63a3a'; bx(.4, .06, .05, 1.1, .12, .06, c); bx(.4, .32, .05, 1.1, .12, .06, c); box(.15, .04, .05, .3, .42, .3, c); tube([.2, .25, .35], [.05, .25, 1.1], '#3a3f4c'); tube([.05, .12, 1.1], [.05, .38, 1.1], '#3a3f4c'); wheel(.2, .44); wheel(1.4, .44); wheel(1.4, .14);
  }, { variants: [{}, { c: '#f2c230' }] }),

  F('courier.forklift', [...CW, 'forklift', 'vehicle'], [2.5, 1, 2.1], p => {
    const c = p.c || '#f2b020';
    for (const y of [.2, .7]) { post(1.75, y, 0, 2.05, '#3a3f4c'); post(1.75 + PX, y, 0, 2.05, '#5a6272'); bx(1.75, y - .05, .12 + (p.up ? .7 : 0), .75, .1, .05, '#8a9098'); } lw([1.75, .2, 2.05], [1.75, .7, 2.05], '#3a3f4c');
    if (p.load) { pallet(1.8, .05, .17 + (p.up ? .7 : 0), .7, .9); carton(1.84, .1, .3 + (p.up ? .7 : 0), .6, .8, .5); }
    box(.1, .1, .15, .5, .8, .75, '#3a3f4c'); box(.6, .1, .15, 1.1, .8, .45, c); qy(.6, 1.7, .9, .15, .25, HZ); bx(.75, .25, .6, .45, .5, .12, '#2a2733'); bx(.7, .25, .6, .1, .5, .5, '#2a2733');
    tube([1.35, .3, .6], [1.25, .3, .95], '#3a3f4c'); cyl(1.25, .5, .95, .1, .02, '#2a2733', { ol: false });
    for (const [x, y] of [[.15, .12], [.15, .88], [1.65, .88], [1.65, .12]]) post(x, y, .6, 1.85, '#3a3f4c'); box(.1, .08, 1.85, 1.6, .84, .06, c);
    for (const x of [.3, 1.35]) { cyl(x, .92, .16, .17, 0, '#2a2733', { ol: false }); cyl(x, .93, .16, .07, 0, '#aab2ba', { ol: false }); } lit(() => spx(.9, .5, 1.95, 0, 0, '#ff8a40')); glow(() => qy(1.72, 1.74, .9, .5, .58, '#fff2c4'));
  }, { vb: [-.3, -.3, 0, 2.9, 1.3, 2.3], use: { x: 1, y: 1.5 }, seats: [{ x: .95, y: .5, z: .72, dir: 0 }], variants: [{}, { load: true, up: true }, { c: '#e8643a', load: true }] }),

  F('courier.handtruck', [...CW, 'decor', 'handtruck'], [.5, .5, 1.3], p => {
    tube([.1, .2, .05], [.1, .1, 1.25], '#d63a3a'); tube([.4, .2, .05], [.4, .1, 1.25], '#d63a3a'); for (const z of [.4, .8, 1.2]) lw([.1, .2 - z * .08, z], [.4, .2 - z * .08, z], '#d63a3a'); bx(.08, .2, .03, .34, .24, .03, '#8a9098'); wheel(.08, .16); wheel(.42, .16);
    if (p.load) { carton(.1, .2, .06, .3, .24, .3); carton(.12, .2, .36, .26, .22, .24, '#d8b07a'); }
  }, { variants: [{ load: true }, {}] }),

  F('courier.bench', ['sorting_bench', ...CW, 'sortstation', 'packstation'], [2, 1, 2], p => {
    const c = '#d2a26a'; box(0, 0, 0, 2, .08, 1.9, '#8a9098', { l: (u, v) => (u % 4 === 1 && v % 4 === 1) ? '#5a6272' : '#aab2ba' });
    for (let i = 0; i < 5; i++) { const x = .15 + i * .3; lw([x, .08, 1.5], [x, .08, 1.3], ['#d63a3a', '#3a3f4c', '#f2c230', '#3c64ad', '#3a3f4c'][i]); spx(x, .08, 1.28, 0, 0, '#aab2ba'); } cyl(1.75, .1, 1.5, .14, 0, '#c8a068', { ol: false }); box(.1, .08, 1.7, 1.2, .25, .04, c); for (let i = 0; i < 3; i++) carton(.15 + i * .38, .1, 1.74, .34, .2, .12 + i * .03, PC[i], { label: false });
    table(0, .08, 2, .85, .9, c, { leg: '#5a6272', thick: true }); bx(.06, .14, .3, 1.88, .74, .04, '#8a9098'); carton(.2, .3, .34, .5, .4, .3); carton(1.1, .3, .34, .6, .45, .36, '#d8b07a');
    box(.15, .3, .9, .5, .4, .06, '#3a3f4c'); qz(.18, .62, .33, .67, .961, '#aab2ba'); lit(() => qy(.2, .44, .7, .91, .95, '#5af08a')); carton(.22, .36, .96, .36, .3, .26);
    cyl(1.0, .3, .9, .12, .08, '#c8a068', { t: '#e8dcc0' }); bx(1.3, .5, .9, .22, .12, .1, '#d63a3a'); box(1.6, .2, .9, .3, .3, .2, '#e4e0d8'); lit(() => spx(1.84, .5, 1.04, 0, 0, '#5af08a')); qz(1.64, 1.86, .5, .62, .96, '#f8f4ea');
  }, { use: { x: 1, y: 1.4 }, staff: { x: 1, y: 1.4, dir: 3 }, variants: [{}] }),

  F('courier.dispatch', [...CW, 'dispatch', 'computer', 'desk'], [2, 1, 2.1], p => {
    const c = p.c || '#5a6a7a'; box(0, 0, .9, 2, .06, 1.15, '#3a3f4c'); qy(.06, 1.2, .06, .98, 1.98, '#cfe0d0'); for (let i = 0; i < 5; i++) { lw([.1, .06, 1.1 + i * .18], [1.16, .06, 1.2 + ((i * 7) % 3) * .1 + i * .12], '#f4f0e8'); } lw([.5, .06, 1.0], [.7, .06, 1.96], '#9fd0e8'); for (let i = 0; i < 6; i++) spx(.15 + hash2(i, 1) * .95, .06, 1.1 + hash2(i, 2) * .8, 0, 0, i % 2 ? '#d63a3a' : '#3c64ad');
    for (let r = 0; r < 4; r++) { qy(1.3, 1.92, .06, 1.75 - r * .22, 1.93 - r * .22, r % 2 ? '#f6e08a' : '#f8f4ea'); lw([1.34, .06, 1.84 - r * .22], [1.6 + hash2(r, 4) * .25, .06, 1.84 - r * .22], '#3a3f4c'); }
    table(0, .1, 2, .7, .78, c, { leg: '#3a3f4c', inset: .04 }); box(1.5, .14, 0, .46, .6, .66, dk(c, .1)); frameY(1.54, 1.92, .74, .08, .32, '#3a3f4c'); frameY(1.54, 1.92, .74, .36, .62, '#3a3f4c');
    monitor(.3, .2, .78, .5, .36, { scr: '#1e3a34', ink: '#5af08a', seed: 3 }); keyboard(.36, .52, .781); box(1.0, .25, .78, .2, .16, .2, '#2a2733'); post(1.16, .3, .98, 1.2, '#2a2733'); lit(() => spx(1.05, .41, .92, 0, 0, '#ff8a40')); bx(1.4, .4, .78, .22, .3, .03, '#8a5a3a'); qz(1.42, 1.6, .42, .68, .811, '#f8f4ea');
    stool(.6, .95, .5, '#3a3f4c', { r: .17 });
  }, { use: { x: .6, y: 1.4 }, staff: { x: .6, y: 1.4, dir: 3 }, seats: [{ x: .6, y: .95, z: .5, dir: 3 }], variants: [{}, { c: '#8a6a4a' }] }),

  F('courier.parcellocker', ['parcel_locker', ...CW, 'lockers', 'parcels'], [2, .5, 2], p => {
    const c = p.c || '#f2b020'; box(0, 0, 0, 2, .5, 1.95, c); qy(0, 2, .5, 0, .1, '#3a3f4c');
    for (let i = 0; i < 4; i++) for (let j = 0; j < 5; j++) { if (i === 2 && j > 1 && j < 4) continue; const x = .05 + i * .48, z = .14 + j * .36; qy(x, x + .44, .5, z, z + .32, dk(c, .08)); frameY(x, x + .44, .5, z, z + .32, dk(c, .45)); spx(x + .38, .5, z + .16, 0, 0, '#3a3f4c'); }
    qy(1.01, 1.45, .5, .86, 1.58, '#3a3f4c'); lit(() => { qy(1.06, 1.4, .5, 1.22, 1.52, '#4ac0e8'); lw([1.1, .5, 1.44], [1.3, .5, 1.44], '#f4fbfc'); lw([1.1, .5, 1.34], [1.36, .5, 1.34], '#f4fbfc'); spx(1.12, .5, .94, 0, 0, '#5af08a'); }); qy(1.1, 1.36, .5, .98, 1.14, '#aab2ba', '#5a6272');
  }, { use: { x: 1.2, y: 1 }, variants: [{}, { c: '#3c5a9a' }] }),

  F('courier.dockdoor', ['truck_bay', 'ship_ramp', ...CW, 'door', 'dock'], p => [p.w || 3, .2, 2.9], p => {
    const w = p.w || 3, o = p.open || 0, zt = 2.6; qy(0, w, .04, 0, 2.9, '#6a7078'); qy(0, .16, .06, 0, zt, HZ); qy(w - .16, w, .06, 0, zt, HZ);
    if (o) { qy(.16, w - .16, .06, 0, zt, '#9fd4ee'); glow(() => qy(.16, w - .16, .06, 0, zt, '#1e2a50')); qy(.16, w - .16, .06, 0, .5, '#8a8f98'); if (p.truck) { qy(.5, w - .5, .06, .45, 2.3, '#e8e4dc'); frameY(.5, w - .5, .06, .45, 2.3, '#8a8478'); lw([w / 2, .06, .45], [w / 2, .06, 2.3], '#8a8478'); qy(.5, w - .5, .06, .3, .45, '#3a3f4c'); lit(() => { qy(.56, .7, .06, .33, .42, '#d63a3a'); qy(w - .7, w - .56, .06, .33, .42, '#d63a3a'); }); } }
    const zb = o ? zt - (1 - o) * zt : 0; if (zb < zt) { qy(.16, w - .16, .06, o ? zt - (zt * (1 - o)) : 0, zt, PAT.siding('#b8c0c8', 3)); lw([.16, .06, zb], [w - .16, .06, zb], '#3a3f4c'); if (!o) { qy(w / 2 - .3, w / 2 + .3, .07, 1.3, 1.6, '#3a4a5a', '#4a5a6a'); bx(w / 2 - .15, .06, .1, .3, .05, .06, '#3a3f4c'); } }
    box(0, 0, zt, w, .2, .3, '#5a6272'); signY('BAY ' + (p.n || 1), w / 2 - .7, w / 2 + .7, .2, zt - .08, zt + .36, '#f2c230', '#2a2733'); lit(() => { spx(.3, .2, zt + .15, 0, 0, o ? '#5af08a' : '#ff4a4a'); spx(.3, .2, zt + .15, 1, 0, o ? '#5af08a' : '#ff4a4a'); });
  }, { wall: true, mount: 0, solid: false, use: { x: 1.5, y: .8 }, variants: [{ n: 1 }, { n: 2, open: .55 }, { n: 3, open: 1, truck: true }, { n: 4, open: 1 }] }),

  F('courier.sign', ['manifest_board', ...CW, 'sign', 'decor'], [1, .1, 2.2], p => {
    const k = p.kind || 'hardhat';
    if (k === 'days') { box(0, 0, 1.3, 1, .04, .8, '#3f8a55'); qy(.05, .95, .04, 1.35, 2.05, '#f4f0e8'); textY('SAFE', .22, .04, 2.0, '#3f8a55'); qy(.3, .7, .04, 1.4, 1.62 + .08, '#2a2733'); lit(() => textY(String(p.n || 42), .38, .04, 1.66, '#ff8a40')); return; }
    if (k === 'board') { box(0, 0, 1.1, 1, .04, 1.0, '#8a5a3a'); qy(.05, .95, .04, 1.15, 2.05, '#f8f4ea'); qy(.05, .95, .04, 1.9, 2.05, '#3c5a9a'); for (let r = 0; r < 5; r++) { spx(.12, .04, 1.8 - r * .13, 0, 0, ['#d63a3a', '#3c64ad', '#f2c230', '#3fae6a', '#d63a3a'][r]); spx(.12, .04, 1.8 - r * .13, 1, 0, ['#d63a3a', '#3c64ad', '#f2c230', '#3fae6a', '#d63a3a'][r]); lw([.22, .04, 1.8 - r * .13], [.5 + hash2(r, 2) * .3, .04, 1.8 - r * .13], '#5a6272'); } return; }
    const tri = k === 'forklift' || k === 'warn';
    if (tri) { fq([[.15, .04, 1.4], [.85, .04, 1.4], [.5, .04, 2.1]], '#2a2733'); fq([[.24, .04, 1.45], [.76, .04, 1.45], [.5, .04, 1.98]], '#f2c230'); if (k === 'warn') { qy(.47, .53, .04, 1.62, 1.86, '#2a2733'); qy(.47, .53, .04, 1.5, 1.57, '#2a2733'); } else { qy(.4, .58, .04, 1.52, 1.64, '#2a2733'); qy(.58, .62, .04, 1.5, 1.8, '#2a2733'); } }
    else { cyl(.5, .04, 1.75, .26, 0, '#3c64ad', { ol: false }); box(.2, 0, 1.45, .6, .04, .6, k === 'exit' ? '#3f8a55' : '#3c64ad'); if (k === 'exit') { lw([.3, .04, 1.75], [.7, .04, 1.75], '#f4f0e8'); lw([.6, .04, 1.85], [.7, .04, 1.75], '#f4f0e8'); lw([.6, .04, 1.65], [.7, .04, 1.75], '#f4f0e8'); } else { qy(.36, .64, .04, 1.72, 1.86, '#f2c230'); qy(.32, .68, .04, 1.68, 1.72, '#f2c230'); qy(.44, .56, .04, 1.56, 1.66, '#f4f0e8'); } }
  }, { wall: true, mount: 1.3, solid: false, variants: [{ kind: 'hardhat' }, { kind: 'forklift' }, { kind: 'warn' }, { kind: 'exit' }, { kind: 'days' }, { kind: 'board' }] }),

  F('courier.crates', [...CW, 'liftstation', 'crates', 'stockroom'], [1, 1, 1], p => {
    const cols = p.cols || ['#3c64ad', '#d63a3a', '#f2c230'], cr = (x, y, z, c) => { box(x, y, z, .46, .46, .3, c, { t: dk(c, .45) }); lw([x + .12, y + .46, z + .2], [x + .34, y + .46, z + .2], dk(c, .5)); qy(x + .06, x + .2, y + .46, z + .05, z + .13, '#f4f0e8'); };
    cr(.02, .02, 0, cols[0]); cr(.5, .02, 0, cols[1]); cr(.02, .5, 0, cols[2]); cr(.5, .5, 0, cols[0]); cr(.02, .02, .3, cols[1]); cr(.5, .26, .3, cols[2]); if (p.tall) cr(.02, .02, .6, cols[0]);
  }, { use: { x: .5, y: 1.5 }, variants: [{}, { tall: true, cols: ['#3fae6a', '#e8843a', '#7a55b0'] }, { cols: ['#c8a068', '#c8a068', '#b8905a'] }] }),

  F('courier.cage', [...CW, 'cart', 'parcels'], [1, 1, 1.8], p => {
    box(.05, .05, .1, .9, .9, .05, '#8a9098'); post(.06, .06, .1, 1.75, CH); post(.94, .06, .1, 1.75, CH); if (!p.empty) parcels(.1, .1, .15, .8, .8, 7, p.seed || 3);
    const mesh = (u, v) => (u % 4 === 0 || v % 5 === 0) ? CH : null; qy(.06, .94, .94, .15, 1.75, mesh); qx(.94, .06, .94, .15, 1.75, mesh); post(.06, .94, .1, 1.75, CH); post(.94, .94, .1, 1.75, CH); lw([.06, .94, 1.75], [.94, .94, 1.75], CH); lw([.94, .06, 1.75], [.94, .94, 1.75], CH);
    wheel(.1, .9); wheel(.9, .9); wheel(.9, .1);
  }, { variants: [{}, { empty: true }, { seed: 8 }] }),

  F('courier.bins', [...CW, 'sortstation', 'bins'], [2, .5, 1], p => {
    ['#d63a3a', '#3c64ad', '#f2c230', '#3fae6a'].forEach((c, i) => { const x = i * .5; box(x + .03, .03, 0, .44, .44, .7, c, { t: dk(c, .5) }); qy(x + .1, x + .4, .47, .3, .56, '#f4f0e8'); textY('NSEW'[i], x + .2, .47, .52, dk(c, .3)); if ((i + (p.seed || 0)) % 2) carton(x + .1, .1, .6, .3, .26, .2, PC[i], { label: false }); });
  }, { use: { x: 1, y: 1 }, variants: [{ seed: 0 }, { seed: 1 }] }),

  F('courier.cone', [...CW, 'generic', 'decor'], [.5, .5, .6], p => { box(.1, .1, 0, .3, .3, .04, '#e8643a'); fq([[.15, .35, .04], [.35, .35, .04], [.27, .27, .55], [.23, .27, .55]], '#e8643a'); fq([[.35, .35, .04], [.35, .15, .04], [.27, .23, .55], [.27, .27, .55]], '#c0502a'); lw([.18, .35, .25], [.33, .35, .25], '#f4f0e8'); lw([.19, .35, .28], [.32, .35, .28], '#f4f0e8'); }, {}),
];
export default courier;
export const galleryItems = [
  compose([courier, generic], 'room.courier', 11, 8, 3.2, { floor: PAT.ftile('#9a9a98', '#929290', 2), wall: '#c8ccc8', dado: .3, dadoc: '#f2c230' }, [
    ['courier.dockdoor', .4, 0, { n: 1, open: 1, truck: true }], ['courier.dockdoor', 3.8, 0, { n: 2 }], ['courier.sign', 7, 0], ['courier.sign', 8.1, 0, { kind: 'forklift' }], ['courier.sign', 9.3, 0, { kind: 'days' }],
    ['courier.shelf', 8.6, 1.4], ['courier.shelf', 8.6, 2.8, { seed: 9, pal: ['#c99a62', '#d63a3a', '#3c64ad', '#f2c230', '#e8e0d0'] }], ['courier.pallet', .5, 1.4, { wrap: true, n: 2, band: '#d63a3a' }], ['courier.pallet', 2.3, 1.2, { kind: 'barrels' }], ['courier.forklift', 4.4, 1.4, { load: true, up: true }],
    ['courier.conveyor', .6, 3.8, { w: 4, scan: true, seed: 5 }], ['dude', 2.4, 5.2, '#e8843a'], ['courier.bins', 5.4, 3.6], ['courier.cage', 5.5, 4.8], ['courier.bench', 7, 5.2 - .6], ['courier.dispatch', .5, 6.2 - .3], ['courier.parcellocker', 3.2, 6.6],
    ['courier.crates', 9.6, 5.4], ['courier.handtruck', 9.4, 6.8], ['courier.palletjack', 6.6, 6.9], ['courier.cone', 3.4, 2.6], ['courier.pile', 7.2, 2.4], ['dude', 8.3, 6.3, '#f2c230'],
  ]),
];
