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
