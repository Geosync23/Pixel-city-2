// Office fixtures.
import { box, qy, qx, qz, lw, fq, glow, lit, ball, cyl, dk, lt, mix, PAT, textY, signY, spx, hash2, rng } from '../../engine/raster.js';
import { F, K, bx, tube, post, posts, frameY, frameX, frameZ, table, rtable, chair, stool, sofa, counter, till, monitor, goods, shelf, heap, heap2, carton, plant, compose, steam, plate, cup, bottle, lamp, candle, rug, pleat, screenY, screenLines, mirrorY, dude, keyboard, PX } from './_lib.js';
import generic from './generic.js';
const ST = '#b8bcc0';
/** swivel office chair on a .5 footprint; dir like chair() */
function ochair(x, y, dir, c, hi) {
  const cx = x + .25, cy = y + .25, bh = hi ? 1.15 : .95; cyl(cx, cy, 0, .17, .03, '#3a3f4c', { ol: false }); tube([cx, cy, .03], [cx, cy, .36], '#8a9098');
  const back = () => { if (dir === 1) bx(x + .07, y + .04, .5, .36, .07, bh - .5, c); if (dir === 0) bx(x + .04, y + .07, .5, .07, .36, bh - .5, c); if (dir === 3) bx(x + .07, y + .39, .5, .36, .07, bh - .5, c); if (dir === 2) bx(x + .39, y + .07, .5, .07, .36, bh - .5, c); };
  if (dir < 2) back(); box(x + .06, y + .06, .36, .38, .38, .1, c, { t: lt(c, .12) }); if (dir >= 2) back();
}
const papers = (x, y, z) => { qz(x, x + .2, y, y + .26, z, '#f8f4ea'); lw([x + .04, y + .06, z], [x + .16, y + .06, z], '#8a8478'); lw([x + .04, y + .14, z], [x + .14, y + .14, z], '#8a8478'); };
const office = [
  F('office.cubicle', ['own_desk', 'office', 'computer', 'deskjob', 'desk', 'seating'], [2, 1.5, 1.4], p => {
    const c = p.pc || '#8a9ab0', d = p.dc || '#e8dcc4', flat = p.open;
    if (!flat) { box(0, 0, 0, .08, 1.5, 1.35, c, { r: PAT.stucco(dk(c, .3)) }); box(.08, 0, 0, 1.92, .08, 1.35, c, { l: PAT.stucco(dk(c, .12)) }); lw([.08, .08, 1.35], [2, .08, 1.35], lt(c, .4)); }
    if (!flat) { qy(1.2, 1.7, .08, .85, 1.2, '#f6e08a'); qy(1.25, 1.45, .08, .95, 1.1, '#e87aa0'); qy(.2, .5, .08, .9, 1.2, '#f8f4ea'); lw([.24, .08, 1.1], [.46, .08, 1.1], '#3c64ad'); lw([.24, .08, 1.02], [.4, .08, 1.02], '#8a8478'); }
    table(.1, .1, 1.85, .6, .75, d, { leg: '#8a9098', inset: .04 }); box(1.45, .14, 0, .46, .5, .62, '#8a9098'); frameY(1.49, 1.87, .64, .06, .3, '#5a6272'); frameY(1.49, 1.87, .64, .34, .58, '#5a6272');
    monitor(.6, .16, .75, .5, .36, { scr: p.scr || '#3a6ea5', seed: p.seed || 1 }); if (p.dual) monitor(1.14, .16, .75, .42, .32, { scr: '#2a3a4a', ink: '#5af08a', seed: 4 }); keyboard(.66, .44, .751); spx(1.1, .5, .76, 0, 0, '#3a3f4c'); spx(1.1, .5, .76, 1, 0, '#3a3f4c');
    cup(.3, .4, .75, p.cup || '#c0563a'); papers(1.5, .36, .751); if (p.plant) plant(.3, .22, .75, .5);
    ochair(.65, .8, 3, p.cc || '#3a4a6a');
  }, { use: { x: .9, y: 1.4 }, seats: [{ x: .9, y: 1.05, z: .46, dir: 3 }], variants: [{}, { scr: '#2a8a6a', cc: '#c0563a', dual: true, seed: 3 }, { pc: '#a8a090', plant: true, scr: '#f4f0e8', cup: '#3f8a55', seed: 6 }, { open: true, dc: '#d2a26a', seed: 8 }] }),

  F('office.bossdesk', ['boss_office', 'office', 'desk', 'boss', 'computer'], [2.5, 2, 1.3], p => {
    const c = p.c || '#6a4028'; ochair(1, .05, 1, '#2a2733', true);
    box(.1, .7, 0, 2.3, .9, .7, c); qy(.1, 2.4, 1.6, 0, .08, dk(c, .5)); for (let i = 0; i < 3; i++) frameY(.2 + i * .74, .84 + i * .74, 1.6, .16, .6, dk(c, .35)); box(.05, .65, .7, 2.4, 1.0, .07, lt(c, .12));
    monitor(1.5, .85, .77, .5, .36, { scr: '#2a3a4a', ink: '#5af08a' }); lamp(.35, .95, .77, .45, '#2f8a55', { r: .12, base: '#d8a848' }); papers(.75, 1.05, .771); box(1.0, 1.45, .77, .5, .06, .12, '#d8a848', { ol: false }); qy(1.04, 1.46, 1.51, .8, .86, '#2a2733');
    bx(2.0, 1.2, .77, .2, .2, .1, '#2a2733'); cup(.6, 1.4, .77, '#f1ede4');
  }, { use: { x: 1.25, y: 2.1 }, seats: [{ x: 1.25, y: .3, z: .46, dir: 1 }], staff: { x: 1.25, y: .3, dir: 1 }, variants: [{}, { c: '#2e3440' }] }),

  F('office.meeting', ['meeting_room', 'office', 'table', 'seating', 'meeting'], [3, 2, 1.1], p => {
    const c = p.c || '#d2a26a', cc = p.cc || '#3a4a6a';
    ochair(.8, 0, 1, cc); ochair(1.7, 0, 1, cc); ochair(0, .75, 0, cc);
    bx(1.2, .8, 0, .6, .4, .68, dk(c, .35)); box(.6, .55, .68, 1.8, .9, .07, c); 
    papers(.9, .7, .751); papers(1.8, 1.1, .751); cup(1.3, .75, .75); cup(2.1, .8, .75, '#c0563a'); bx(1.4, .9, .75, .2, .2, .05, '#2a2733'); lit(() => spx(1.5, 1.1, .78, 0, 0, '#5af08a'));
    bx(.75, 1.05, .75, .3, .2, .02, '#8a9098'); bx(.75, 1.05, .77, .3, .02, .2, '#5a6272'); 
    ochair(2.5, .75, 2, cc); ochair(.8, 1.5, 3, cc); ochair(1.7, 1.5, 3, cc);
  }, { seats: [{ x: 1.05, y: .25, z: .46, dir: 1 }, { x: 1.95, y: .25, z: .46, dir: 1 }, { x: .25, y: 1, z: .46, dir: 0 }, { x: 2.75, y: 1, z: .46, dir: 2 }, { x: 1.05, y: 1.75, z: .46, dir: 3 }, { x: 1.95, y: 1.75, z: .46, dir: 3 }], variants: [{}, { c: '#5a3a28', cc: '#2a2733' }] }),

  F('office.whiteboard', ['office', 'whiteboard', 'decor'], [2, .1, 2.1], p => {
    box(0, 0, .9, 2, .05, 1.2, '#aab2ba'); qy(.05, 1.95, .05, .95, 2.05, '#f8f6f0');
    lw([.2, .05, 1.2], [.2, .05, 1.9], '#3a3f4c'); lw([.2, .05, 1.2], [1.0, .05, 1.2], '#3a3f4c'); let z = 1.3; for (let i = 0; i < 6; i++) { const nz = 1.3 + hash2(i, p.seed || 1) * .5; lw([.25 + i * .13, .05, z], [.38 + i * .13, .05, nz], '#c0392b'); z = nz; }
    for (let i = 0; i < 4; i++) lw([1.2, .05, 1.85 - i * .13], [1.4 + hash2(i, 3) * .4, .05, 1.85 - i * .13], i ? '#3c64ad' : '#3f8a55'); qy(1.5, 1.7, .05, 1.1, 1.28, '#f6e08a'); qy(1.72, 1.9, .05, 1.15, 1.33, '#f4b8c8'); bx(.6, .05, .9, .8, .06, .03, '#8a9098');
  }, { wall: true, mount: .9, solid: false, use: { x: 1, y: .6 }, variants: [{ seed: 1 }, { seed: 5 }] }),

  F('office.chart', ['office', 'decor', 'chart'], [1, .1, 2], p => {
    const k = p.kind || 'bars';
    if (k === 'cork') { box(0, 0, 1, 1, .05, .9, '#8a5a3a'); qy(.05, .95, .05, 1.05, 1.85, '#c8a068', '#b89058'); [['#f8f4ea', .1, 1.5, .25, .3], ['#f6e08a', .4, 1.55, .2, .2], ['#9fd0e8', .65, 1.4, .25, .35], ['#f4b8c8', .15, 1.12, .2, .2], ['#f8f4ea', .42, 1.1, .2, .3]].forEach(([c, x, z, w, h]) => { qy(x, x + w, .05, z, z + h, c); spx(x + w / 2, .05, z + h, 0, 1, '#c0392b'); }); return; }
    if (k === 'calendar') { box(.1, 0, 1.05, .8, .04, .85, '#f8f4ea'); qy(.1, .9, .04, 1.7, 1.9, '#c0392b'); for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) spx(.2 + i * .14, .04, 1.58 - j * .13, 0, 0, (i + j * 5) === 8 ? '#c0392b' : '#8a8478'); return; }
    box(0, 0, 1, 1, .04, .9, '#3a3f4c'); qy(.05, .95, .04, 1.05, 1.85, '#f8f6f0');
    if (k === 'bars') [.3, .5, .42, .65, .58].forEach((h, i) => qy(.14 + i * .16, .26 + i * .16, .04, 1.12, 1.12 + h, ['#3c64ad', '#3c64ad', '#6fb6d8', '#3c64ad', '#e8843a'][i]));
    else { let z = 1.2; for (let i = 0; i < 6; i++) { const nz = 1.2 + .1 * i + (hash2(i, 2) - .4) * .16; lw([.12 + i * .13, .04, z], [.25 + i * .13, .04, nz], '#3f8a55'); z = nz; } ball(.75, .05, 1.35, .09, '#e8843a', { ol: false }); }
    lw([.1, .04, 1.1], [.9, .04, 1.1], '#8a8478');
  }, { wall: true, mount: 1, solid: false, variants: [{ kind: 'bars' }, { kind: 'line' }, { kind: 'cork' }, { kind: 'calendar' }] }),

  F('office.copier', ['office', 'copier', 'printer'], [1, 1, 1.2], p => {
    const c = '#e4e0d8'; box(.05, .1, 0, .9, .8, .7, c); for (let i = 0; i < 3; i++) { frameY(.1, .9, .9, .08 + i * .2, .24 + i * .2, '#8a8478'); lw([.4, .9, .18 + i * .2], [.6, .9, .18 + i * .2], '#5a6272'); }
    box(0, .05, .7, 1, .9, .2, '#d8d4cc'); box(.05, .1, .9, .9, .7, .08, '#5a6272', { t: '#6a7282' }); bx(.95, .3, .6, .25, .4, .03, '#c8c4bc'); qz(.97, 1.18, .34, .66, .631, '#f8f4ea');
    qy(.1, .5, .95, .74, .86, '#2a2733'); lit(() => { qy(.12, .36, .95, .76, .84, '#6ad0f0'); spx(.42, .95, .8, 0, 0, '#5af08a'); }); for (let i = 0; i < 4; i++) spx(.6 + i * .08, .95, .8, 0, 0, '#8a8478');
  }, { vb: [-.3, -.3, 0, 1.5, 1.3, 1.5], use: { x: .5, y: 1.5 }, variants: [{}] }),

  F('office.filing', ['filing_cabinet', 'office', 'bank', 'clinic', 'filing', 'decor'], p => [p.w || 1, .5, p.h || 1.4], p => {
    const w = p.w || 1, h = p.h || 1.4, c = p.c || '#8a9aa8', n = Math.round((h - .1) / .32), cols = Math.round(w / .5);
    box(0, 0, 0, w, .5, h, c); qy(0, w, .5, 0, .08, dk(c, .5));
    for (let k = 0; k < cols; k++) for (let i = 0; i < n; i++) { const x = k * .5, z = .1 + i * (h - .14) / n, zh = (h - .14) / n - .04; frameY(x + .04, x + .46, .5, z, z + zh, dk(c, .4)); lw([x + .18, .5, z + zh * .6], [x + .32, .5, z + zh * .6], '#e4e8ec'); qy(x + .19, x + .31, .5, z + zh * .25, z + zh * .45, '#f1ede4'); }
    if (p.top === 'plant') plant(w / 2, .25, h, .7); else if (p.top === 'boxes') { carton(.05, .08, h, .4, .34, .28); if (w > .6) carton(.52, .1, h, .4, .32, .2, '#d8b07a'); }
    if (p.openDrawer) { box(.04, .5, .1 + (h - .14) / n * (n - 1), .42, .3, (h - .14) / n - .04, c, { t: goods('files', 1, { seed: 2 }) }); }
  }, { use: { x: .5, y: 1 }, variants: [{}, { w: 1.5, h: 1.1, c: '#c8b890', top: 'plant' }, { c: '#5a6272', top: 'boxes' }, { h: 1.8, w: .5, c: '#a8b4a0' }] }),

  F('office.reception', ['office', 'reception', 'checkout', 'counter'], [3, 1, 1.2], p => {
    const c = p.c || '#f1ede4', a = p.a || '#3c64ad';
    box(0, 0, 0, .5, .5, .75, c); table(.5, 0, 2.5, .5, .75, '#d2a26a', { leg: '#8a9098' }); monitor(1.2, .1, .75, .46, .32, { scr: '#3a6ea5' }); bx(2.2, .15, .75, .2, .2, .08, '#2a2733');
    box(0, .5, 0, 3, .5, 1.1, c); qy(0, 3, 1, 0, .1, dk(c, .5)); qy(0, 3, 1, .1, .25, a); lit(() => lw([0, 1, .27], [3, 1, .27], lt(a, .5))); signY(p.name || 'MAPLE CO', .5, 2.5, 1, .42, .92, c, a, { frame: false }); box(-.03, .47, 1.1, 3.06, .56, .06, '#d2a26a');
    plant(2.7, .75, 1.16, .6, { flower: '#e87aa0' }); bx(.3, .65, 1.16, .3, .2, .03, '#f8f4ea'); cyl(.9, .75, 1.16, .05, .1, '#3a3f4c', { ol: false }); post(.9, .75, 1.26, 1.36, '#3c64ad');
  }, { vb: [-.3, -.3, 0, 3.3, 1.3, 1.9], use: { x: 1.5, y: 1.5 }, staff: { x: 1.4, y: -.4, dir: 1 }, variants: [{}, { c: '#2e3440', a: '#e8843a', name: 'BAYWORKS' }] }),

  F('office.coffee', ['coffee_machine', 'office', 'coffee', 'kitchenette'], [1.5, .5, 1.9], p => {
    const c = p.c || '#f1ede4'; counter(0, 0, 1.5, .5, .95, c, '#5a6272', { pw: .5 });
    box(.1, .08, .95, .34, .3, .44, '#2a2733'); qy(.16, .38, .38, 1.0, 1.2, '#1e1a20'); cup(.27, .32, .95, '#f1ede4'); lit(() => { spx(.38, .38, 1.32, 0, 0, '#5af08a'); spx(.34, .38, 1.32, 0, 0, '#ff5a4a'); }); steam(.27, .32, 1.1, 2);
    cyl(.65, .25, .95, .09, .24, '#d5dbe0'); post(.65, .25, 1.19, 1.25, '#2a2733'); for (let i = 0; i < 3; i++) cup(.95 + i * .13, .2, .95, ['#c0563a', '#3c64ad', '#f2c230'][i]); box(1.1, .25, .95, .3, .18, .1, '#8a5a3a', { t: heap2(['#f4f0e8', '#f4b8c8', '#c8a070'], 8, 1) });
    box(0, 0, 1.5, 1.5, .3, .4, c); frameY(.05, .72, .3, 1.54, 1.86, dk(c, .3)); frameY(.78, 1.45, .3, 1.54, 1.86, dk(c, .3)); glow(() => lw([.05, .3, 1.49], [1.45, .3, 1.49], '#fff2c4'));
  }, { use: { x: .4, y: 1 }, variants: [{}, { c: '#5a7a8a' }] }),

  F('office.server', ['office', 'server', 'decor'], [1, 1, 2.1], p => {
    const c = '#2e3440'; box(0, 0, 0, 1, 1, 2.05, c); qy(.08, .92, 1, .1, 1.95, '#1a1c24');
    for (let i = 0; i < 11; i++) { const z = .16 + i * .16; qy(.1, .9, 1, z, z + .12, i % 4 === 3 ? '#3a3f4c' : '#262a34'); lit(() => { for (let k = 0; k < 5; k++) { const h = hash2(i, k, p.seed || 1); if (h > .25) spx(.16 + k * .07, 1, z + .06, 0, 0, h > .85 ? '#ff8a40' : h > .55 ? '#5af08a' : '#6ad0f0'); } }); lw([.6, 1, z + .06], [.84, 1, z + .06], '#4a5262'); }
    qy(.08, .92, 1, .1, 1.95, '#6a8aa8', 'glass'); frameY(.08, .92, 1, .1, 1.95, '#5a6272'); qx(1, .1, .9, .2, 1.9, (u, v) => (u + v) % 3 === 0 ? '#1a1c24' : dk(c, .36));
  }, { variants: [{ seed: 1 }, { seed: 5 }] }),

  F('office.elevator', ['office', 'elevator', 'door'], [2, .2, 2.5], p => {
    const c = p.c || '#8a8478'; qy(0, 2, .04, 0, 2.3, c); qy(.2, 1.8, .06, 0, 2.0, '#c4c9ce', '#b8bcc0'); frameY(.2, 1.8, .06, 0, 2.0, '#5a6272'); lw([1, .06, 0], [1, .06, 2.0], '#5a6272'); lw([.98, .06, 0], [.98, .06, 2.0], '#e4e8ec');
    for (const x of [.3, 1.1]) frameY(x, x + .6, .06, .2, 1.8, '#aab2ba'); 
    lit(() => { qy(.75, 1.25, .06, 2.06, 2.26, '#1e2028'); textY(String(p.floor || 3), .92, .06, 2.24, '#ff8a40'); spx(1.12, .06, 2.16, 0, 0, '#5af08a'); spx(1.12, .06, 2.16, 1, 1, '#5af08a'); spx(1.12, .06, 2.16, -1, 1, '#5af08a'); });
    qy(1.86, 1.96, .06, .9, 1.15, '#d5dbe0'); lit(() => spx(1.9, .06, 1.08, 0, 0, '#f6e04a'));
  }, { wall: true, mount: 0, solid: false, use: { x: 1, y: .6 }, variants: [{}, { c: '#5a4a3a', floor: 7 }] }),

  F('office.printer', ['office', 'printer', 'decor'], [1, .5, 1.1], p => {
    box(0, 0, 0, 1, .5, .7, '#d2a26a'); frameY(.06, .48, .5, .1, .62, '#a8743f'); frameY(.52, .94, .5, .1, .62, '#a8743f');
    box(.2, .06, .7, .6, .4, .24, '#e4e0d8'); qy(.26, .74, .46, .74, .8, '#2a2733'); qz(.3, .7, .46, .6, .76, '#f8f4ea'); lit(() => spx(.72, .46, .88, 0, 0, '#5af08a')); box(.25, .1, .94, .5, .25, .04, '#c8c4bc', { ol: false }); for (let i = 0; i < 3; i++) box(.02, .1, .7 + i * .05, .16, .3, .05, '#f8f4ea', { ol: false });
  }, { use: { x: .5, y: 1 } }),
];
export default office;
export const galleryItems = [
  compose([office, generic], 'room.office', 10, 8, 2.8, { floor: PAT.ftile('#7a8a9a', '#74849a', 1), wall: '#e4e0d4' }, [
    ['office.elevator', .4, 0], ['office.whiteboard', 2.9, 0], ['office.chart', 5.2, 0], ['office.chart', 6.4, 0, { kind: 'cork' }], ['office.coffee', 7.8, .05],
    ['office.cubicle', .3, 1.6], ['office.cubicle', 2.4, 1.6, { scr: '#2a8a6a', cc: '#c0563a', dual: true }], ['office.cubicle', .3, 3.4, { pc: '#a8a090', plant: true }], ['office.cubicle', 2.4, 3.4, {}], ['dude', 3.3, 2.75, '#f1ede4', 0, { sit: 1 }],
    ['office.meeting', 5.6, 1.6], ['office.bossdesk', 7.2, 4.2], ['office.filing', 5, 4.2], ['office.server', 9, .1 + 99], ['office.copier', 5.2, 5.4],
    ['office.reception', .5, 6.2], ['dude', 1.9, 5.9, '#3c64ad'], ['office.printer', 4 + 99, 7], ['generic.cooler', 4.2, 5.2], ['dude', 4.2, 6.9, '#e8843a'],
  ].filter(i => i[1] < 50 && i[2] < 50)),
];
