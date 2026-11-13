// Generic interior fixtures shared by all venues.
import { box, qy, qx, qz, lw, glow, lit, ball, cyl, dk, lt, mix, PAT, textY, signY, spx, hash2, rng, winY } from '../../engine/raster.js';
import { F, K, bx, tube, post, posts, frameY, frameX, frameZ, plant, PX } from './_lib.js';
const generic = [
  F('generic.door', ['generic', 'door'], [1, .1, 1.8], p => {
    const c = p.c || '#5a4a3a';
    qy(0, 1, .04, 0, 1.75, dk(c, .1)); 
    if (p.kind === 'staff') { qy(.07, .93, .05, 0, 1.68, p.dc || '#8a9aa8'); frameY(.07, .93, .05, 0, 1.68, dk(p.dc || '#8a9aa8', .45)); qy(.3, .7, .05, 1.05, 1.45, '#3a4a5a', '#4a5a6a'); frameY(.3, .7, .05, 1.05, 1.45, '#3a3f4c'); qy(.3, .7, .05, .72, .86, '#f4f0e8'); lw([.35, .05, .79], [.65, .05, .79], '#3a3f4c'); spx(.84, .05, .85, 0, 0, '#f2c230'); spx(.84, .05, .85, 0, 1, '#f2c230'); qy(.07, .93, .05, 0, .14, '#6a7078'); }
    else { qy(.07, .93, .05, 0, 1.68, '#9fd4e6', '#b8e2ee'); glow(() => qy(.07, .93, .05, 0, 1.68, '#2a3a6a', '#34447a')); frameY(.07, .93, .05, 0, 1.68, dk(c, .3)); frameY(.13, .87, .05, .08, 1.62, lt(c, .1)); lw([.2, .05, 1.5], [.32, .05, 1.26], '#f4fbfc'); lw([.25, .05, 1.5], [.37, .05, 1.26], '#f4fbfc'); tube([.8, .06, .7], [.8, .06, 1.0], '#d8a848'); qy(.3, .7, .06, 1.08, 1.26, p.sc || '#d63a3a'); lw([.36, .06, 1.17], [.64, .06, 1.17], '#f4f0e8'); lw([.5, .06, 1.26], [.5, .06, 1.4], '#8a8478'); }
    lw([0, .04, 1.75], [1, .04, 1.75], dk(c, .5));
  }, { wall: true, solid: false, use: { x: .5, y: .5 }, variants: [{}, { kind: 'staff' }, { kind: 'staff', dc: '#a85a4a' }, { c: '#2f6f5f', sc: '#3f8a55' }] }),
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
