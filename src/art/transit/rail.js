// Rail infrastructure: elevated viaduct (deck, piers, truss span, brick arches) + ground track, buffer, signal, crossing gate.
// VIADUCT LOCAL COORDS: the deck runs along x, is 6 wide (y 0..6); local z = 0 is the deck UNDERSIDE, the track bed is at z = 0.6.
// Track centre lines at y = 1.7 and y = 4.3. Trains (veh.train.car, 2.2 wide) are placed at y = 0.6 / 3.2, z = deck z + 0.6.
import { box, qy, qx, qz, lw, fq, lit, glow, dk, lt, mix, ENV, PAT, hash2, rng, textY, textW, signY, winY, U } from '../../engine/raster.js';
import { RAIL, COL, disc, lamp, halo, post, pole, prof, ledY } from './_lib.js';

const BED = RAIL.SLAB, DW = RAIL.DECK_W, TY = RAIL.TRACK_Y, G = RAIL.GAUGE;
const CONC = '#bdb8ab', CONC2 = '#a9a498', STEEL = '#56636b';

/** slab track on a deck / ballast: sleepers + two rails centred on y = c at height z */
export function rails(x0, x1, c, z, o) {
  o = o || {}; const sl = o.sleeper || '#8f897d', step = o.step || .5;
  for (let x = x0 + .12; x < x1 - .1; x += step) qz(x, Math.min(x + .2, x1), c - .78, c + .78, z + .01, sl, o.sleeper2);
  for (const y of [c - G, c + G]) { qz(x0, x1, y - .05, y + .05, z + .02, '#4a4856'); lw([x0, y, z + .1], [x1, y, z + .1], COL.rail); lw([x0, y + .06, z + .04], [x1, y + .06, z + .04], '#35323f'); }
}
/** catenary mast on the back edge of the deck with an arm over both tracks. Local to the deck (z from deck underside). */
export function mast(x) {
  const zt = RAIL.WIRE + .55, c = STEEL;
  box(x - .09, 0, BED, .18, .18, zt - BED, c); box(x - .14, -.04, BED, .28, .26, .2, dk(c, .2), { ol: false });
  lw([x, .1, zt - .1], [x, 4.75, zt - .1], dk(c, .3)); lw([x, .1, zt - .14], [x, 4.75, zt - .14], lt(c, .25));       // arm
  lw([x, .1, zt + .35], [x, 2.6, zt - .1], dk(c, .2)); lw([x, .1, zt - 1.0], [x, 1.0, zt - .14], dk(c, .2));       // stays
  for (const y of TY) { lw([x, y, zt - .14], [x, y, RAIL.WIRE + .22], '#8a5a3a'); lw([x, y - .12, RAIL.WIRE + .22], [x, y + .12, RAIL.WIRE], '#3a3644'); }
  box(x - .09, 0, zt, .18, .18, .4, c, { ol: false });
}
export function wires(x0, x1) { for (const y of TY) { lw([x0, y, RAIL.WIRE + .22], [x1, y, RAIL.WIRE + .22], '#4a4856'); lw([x0, y, RAIL.WIRE], [x1, y, RAIL.WIRE], '#2f2b3a'); } }

export function drawDeck(p) {
  const L = p.len || 8, par = p.parapet || 'both', back = par === 'both' || par === 'back', front = par === 'both' || par === 'front', snow = ENV.season === 3;
  // box girder + cantilevered slab
  box(0, 1.1, 0, L, 3.8, .3, CONC2, { ol: false }); lw([0, 4.9, 0], [L, 4.9, 0], dk(CONC2, .6));
  box(0, 0, .26, L, DW, BED - .26, CONC, { t: snow ? '#dfe5ea' : '#b3aea2' });
  for (let x = 0; x <= L + .01; x += 4) lw([Math.min(x, L - .01), DW, .27], [Math.min(x, L - .01), DW, BED - .02], dk(CONC, .3));
  lw([0, DW, .3], [L, DW, .3], dk(CONC, .45));
  if (back) { box(0, 0, BED, L, .16, .55, CONC, { ol: false }); lw([0, .16, BED + .55], [L, .16, BED + .55], lt(CONC, .5)); lw([0, 0, BED + .55], [L, 0, BED + .55], dk(CONC, .6)); }
  // track slabs
  for (const c of TY) { qz(0, L, c - .95, c + .95, BED + .005, snow ? '#cdd5db' : '#a39e93'); rails(0, L, c, BED); }
  qz(0, L, 2.9, 3.1, BED + .01, '#8f897d'); for (let x = .5; x < L; x += 1) lw([x, 2.9, BED + .01], [x, 3.1, BED + .01], '#6f6a60');     // cable trough covers
  if (p.masts !== false) for (let x = 4; x < L; x += 8) mast(x);
  if (front) {
    box(0, DW - .16, BED, L, .16, .55, CONC, { ol: false });
    for (let x = 0; x < L; x += 2) lw([x, DW, BED + .06], [x, DW, BED + .5], dk(CONC, .16));
    lw([0, DW, BED + .55], [L, DW, BED + .55], lt(CONC, .55)); lw([0, DW - .16, BED + .55], [L, DW - .16, BED + .55], dk(CONC, .5));
    lw([0, DW, BED + .62], [L, DW, BED + .62], STEEL); for (let x = 0; x <= L; x += 1) lw([Math.min(x, L - .02), DW, BED + .55], [Math.min(x, L - .02), DW, BED + .62], STEEL);
    if (snow) lw([0, DW - .08, BED + .56], [L, DW - .08, BED + .56], COL.snow);
  }
  if (p.masts !== false && p.wires !== false) wires(0, L);
}

function drawPier(p) {
  const h = p.h || 4.4, cw = 1.4, cd = 1.6, capH = 1.1, y0 = -2.0, y1 = 3.6, zc = h - capH, c = p.color || CONC;
  box(-.15, -.15, 0, cw + .3, cd + .3, .35, dk(c, .12));
  box(0, 0, .35, cw, cd, zc - .35, c, { l: PAT.planks(dk(c, .18), 8), ol: true });
  for (let z = 1.2; z < zc; z += 1.2) { lw([0, cd, z], [cw, cd, z], dk(c, .34)); lw([cw, 0, z], [cw, cd, z], dk(c, .5)); }
  // hammerhead cap
  const P = (y, z) => [cw, y, z];
  fq([[0, y1, h - .5], [cw, y1, h - .5], [cw, y1, h], [0, y1, h]], dk(c, .18));
  fq([P(0, zc), P(cd, zc), P(y1, h - .5), P(y1, h), P(y0, h), P(y0, h - .5)], dk(c, .36));
  qz(0, cw, y0, y1, h, c);
  lw(P(0, zc), P(y0, h - .5), dk(c, .7)); lw(P(cd, zc), P(y1, h - .5), dk(c, .7)); lw(P(y1, h - .5), P(y1, h), lt(c, .2)); lw(P(y0, h - .5), P(y0, h), dk(c, .7)); lw(P(y0, h), P(y1, h), lt(c, .4));
  lw([0, y1, h - .5], [cw, y1, h - .5], dk(c, .7)); lw([0, y1, h - .5], [0, y1, h], dk(c, .7)); lw([0, y1, h], [cw, y1, h], lt(c, .5));
  // bearings
  for (const y of [-1.2, .8, 2.8]) qx(cw, y - .2, y + .2, h - .08, h, '#4a4856');
  const r = rng(p.seed || 1);
  if (p.poster !== false && r() < .7) { const cc = ['#e0453a', '#3b7bd6', '#f2c230', '#3f9a6a'][Math.floor(r() * 4)]; qy(.35, 1.05, cd + .005, .9, 1.9, '#f1ead6'); qy(.42, .98, cd + .005, 1.3, 1.82, cc); lw([.45, cd + .005, 1.1], [.95, cd + .005, 1.1], '#56535f'); lw([.45, cd + .005, 1.0], [.8, cd + .005, 1.0], '#56535f'); }
  qy(.5, .9, cd + .005, 2.6, 2.85, '#2c4a9a'); textY(String(p.num || (1 + Math.floor(r() * 89))).slice(0, 2), .55, cd + .005, 2.83, '#f6f2e6');
}

function drawTruss(p) {
  const L = p.len || 16, c = p.color || '#b0583a', dpt = 2.0, n = Math.max(2, Math.round(L / 4)), pw = L / n, d = dk(c, .3);
  const side = (y, col, hi) => {
    const m = (a, b, w) => { const dx = b[0] - a[0], dz = b[1] - a[1], k = w / Math.hypot(dx, dz), nx = -dz * k, nz = dx * k; fq([[a[0] - nx, y, a[1] - nz], [b[0] - nx, y, b[1] - nz], [b[0] + nx, y, b[1] + nz], [a[0] + nx, y, a[1] + nz]], col); };
    for (let i = 0; i < n; i++) { const a = i * pw, b = a + pw, mid = a + pw / 2; m([a, -.1], [mid, -dpt + .1], .07); m([mid, -dpt + .1], [b, -.1], .07); m([mid, -.1], [mid, -dpt + .1], .04); }
    qy(0, L, y, -.22, 0, col); qy(0, L, y, -dpt, -dpt + .22, col);
    if (hi) { lw([0, y, 0], [L, y, 0], lt(c, .4)); lw([0, y, -.22], [L, y, -.22], dk(c, .6)); lw([0, y, -dpt + .22], [L, y, -dpt + .22], lt(c, .3)); lw([0, y, -dpt], [L, y, -dpt], dk(c, .7)); for (let x = .25; x < L; x += .5) { lw([x, y, -.1], [x, y, -.12], dk(c, .5)); lw([x, y, -dpt + .1], [x, y, -dpt + .12], dk(c, .5)); } }
  };
  side(.6, dk(c, .45), false);
  for (let i = 0; i <= n; i++) { const x = Math.min(i * pw, L - .12); box(x, .6, -dpt, .12, 4.8, .14, d, { ol: false }); lw([x + .06, .6, -.1], [x + .06, 5.4, -dpt + .1], dk(c, .5)); }   // floor beams + sway bracing
  side(5.4, dk(c, .12), true);
  qx(L, .6, 5.4, -.22, 0, dk(c, .4)); qx(L, .6, 5.4, -dpt, -dpt + .2, dk(c, .4));
  drawDeck(Object.assign({}, p, { len: L }));
}

function drawArch(p, open) {
  const L = p.len || 8, D = DW, h = p.h || 4.4, c = p.color || '#a8553f', stone = p.stone || '#d9cfb8', pierW = .75;
  let R = (L - 2 * pierW) / 2; R = Math.min(R, h - 1.0); const sp = Math.max(.2, h - .6 - R), x0 = L / 2 - R, x1 = L / 2 + R, crown = sp + R;
  const inf = open ? 'open' : (p.infill || 'shop'), rec = .5, r = rng(p.seed || 1), name = p.name || 'CAFE', fc = p.front || '#2f6f5f';
  // what is seen through the opening (drawn first; the wall with a hole is painted over it)
  if (inf === 'open') { qz(x0, x1, 0, D, .001, '#2a1f45', 'glass'); qx(x0, 0, D, 0, crown, PAT.brick(dk(c, .55))); fq([[x0, 0, sp], [x0, D, sp], [x0 + R * .5, D, crown], [x0 + R * .5, 0, crown]], dk(c, .62)); }
  else {
    const y = D - rec; qz(x0, x1, y, D, .001, '#8a8478'); qy(x0, x1, y, 0, crown, inf === 'brick' ? PAT.brick(dk(c, .3)) : dk(fc, .2));
    if (inf === 'shop') {
      const dx = L / 2 + R * .45;
      qy(x0, x1, y, 2.5, crown, COL.glassA, COL.glassB); glow(() => qy(x0, x1, y, 2.5, crown, '#f7d58a', '#eec672'));                    // fanlight
      for (let k = -3; k <= 3; k++) lw([L / 2, y, 2.5], [L / 2 + Math.sin(k * .42) * R, y, 2.5 + Math.cos(k * .42) * R], dk(fc, .4));
      qy(x0, x1, y, 1.95, 2.55, dk(fc, .1)); signY(name, L / 2 - (textW(name) + 10) / U / 2, L / 2 + (textW(name) + 10) / U / 2, y + .005, 2.0, 2.5, '#1f2a33', '#ffd98a', { lit: true });
      winY(x0 + .35, dx - .25, y, .55, 1.8, { on: true, mullion: 'v', sill: true, frame: dk(fc, .5) });
      qy(dx, dx + 1.0, y, 0, 1.8, dk(fc, .45)); winY(dx + .15, dx + .85, y, .7, 1.65, { on: true, frame: dk(fc, .6) }); lw([dx + .82, y, .85], [dx + .82, y, .95], '#ffd98a');
      winY(dx + 1.2, x1 - .3, y, .55, 1.8, { on: r() < .8, frame: dk(fc, .5), sill: true });
      box(x0 + .5, y, 0, .5, .35, .4, '#8c7b6b', { ol: false }); box(x0 + .55, y + .04, .4, .4, .27, .3, '#4f9a45', { t2: '#5aa84f', ol: false });  // planter
      box(x0 + .2, y, 1.86, 2 * R - .4, .45, .08, fc, { t: PAT.ftile(fc, '#f4f0e8', .4), ol: false });                                           // awning
    } else if (inf === 'garage') {
      qy(x0 + .3, x1 - .3, y, 0, 2.9, PAT.siding(p.door || '#5f7f8f', 3)); lw([x0 + .3, y, 2.9], [x1 - .3, y, 2.9], '#2a2634'); qy(x0 + .3, x1 - .3, y, 0, .25, PAT.vstripes('#f2c230', '#2a2634', 4));
      signY(p.name || 'GARAGE', L / 2 - 1.4, L / 2 + 1.4, y + .005, 3.0, 3.5, '#f1ead6', '#2a2634'); lamp(L / 2, y + .02, 3.75, '#ffe9a8', 4, 3, 2);
    } else {
      winY(L / 2 - 1.6, L / 2 - .6, y, 1.2, 2.3, { on: r() < .5, mullion: 'cross', sill: true }); qy(L / 2 + .4, L / 2 + 1.4, y, 0, 1.8, '#4a5a4a'); lw([L / 2 + 1.25, y, .9], [L / 2 + 1.25, y, 1.0], '#d9cfb8');
      qy(L / 2 - 2.2, L / 2 - 1.9, y, 0, 2.6, '#56636b');
    }
    qx(x0, y, D, 0, crown, PAT.brick(dk(c, .5)));
  }
  // wall with the arched hole
  const Rp = R * U, cx = L * U / 2, spp = sp * U, br = PAT.brick(dk(c, .18)), st = dk(stone, .18), st2 = dk(stone, .3), hp = h * U;
  const wall = (u, v, w, hh) => {
    const dx = u + .5 - cx, dz = v + .5 - spp, d = dz > 0 ? Math.hypot(dx, dz) : Math.abs(dx);
    if (d < Rp && v < spp + Rp) return null;
    if (d < Rp + 4.5) { if (dz <= 0) return (v % 6 === 0) ? st2 : st; const a = Math.atan2(dz, dx); return Math.floor(a * Rp / 6) % 2 === 0 && Math.abs((a * Rp / 6) % 1) < .18 ? st2 : (d > Rp + 3.4 ? st2 : st); }
    if (v >= hp - 7) return v === hp - 7 || v === hp - 4 ? st2 : st;                                   // cornice
    if (u < 5 || u >= w - 5) return (v % 8 === 0) ? st2 : st;                                          // quoins at the bay joints
    if (v < 6) return v === 5 ? st2 : dk(st, .12);                                                      // plinth
    return br(u, v);
  };
  box(0, 0, 0, L, D, h, c, { l: wall, r: PAT.brick(dk(c, .36)), t: '#8a8478' });
  // keystone
  qy(L / 2 - .16, L / 2 + .16, D + .003, crown - .05, crown + .5, stone); lw([L / 2 - .16, D + .003, crown - .05], [L / 2 - .16, D + .003, crown + .5], st2); lw([L / 2 + .16, D + .003, crown - .05], [L / 2 + .16, D + .003, crown + .5], st2);
  if (inf !== 'open' && inf !== 'brick') { lamp(x0 - .3, D + .05, 2.6, '#ffe9a8', 4, 2, 3); lw([x0 - .3, D, 2.8], [x0 - .3, D + .06, 2.8], '#2a2634'); }
  if (ENV.season === 2 && inf === 'shop') { box(x1 - .9, D + .05, 0, .3, .3, .22, '#e08a2c', { ol: false }); }
}

function drawTrack(p) {
  const L = p.len || 8, n = p.tracks === 2 ? 2 : 1, W = 2.6 * n, snow = ENV.season === 3;
  const b1 = snow ? '#d5dce2' : '#7d766c', b2 = snow ? '#c3ccd4' : '#6c665d';
  qz(0, L, 0, W, .01, (x, y) => { const k = hash2(Math.floor(x * 8), Math.floor(y * 8), 5); return k < .22 ? b2 : k > .9 ? lt(b1, .18) : b1; });
  fq([[0, W, .01], [L, W, .01], [L, W + .15, 0], [0, W + .15, 0]], b2);
  for (let i = 0; i < n; i++) rails(0, L, 1.3 + i * 2.6, .02, { sleeper: '#6b5a4a', sleeper2: undefined });
}

export default [
  { id: 'prop.rail.viaduct', kind: 'prop', tags: ['transit', 'rail', 'viaduct', 'deck'], solid: false, size: p => [p.len || 8, DW, BED], vb: p => [-.1, -.3, 0, (p.len || 8) + .1, DW + .2, 5.2],
    variants: [{ len: 8 }, { len: 16 }, { len: 8, parapet: 'back', masts: false }, { len: 8, parapet: 'none' }], draw: drawDeck },
  { id: 'prop.rail.mast', kind: 'prop', tags: ['transit', 'rail', 'viaduct', 'catenary'], solid: false, size: [.2, .2, 4], vb: [-.4, -.2, 0, .5, 5, 5.2], variants: [{}],
    draw(p) { at0(() => mast(.1)); if (p.wires) wires(-4, 4); } },
  { id: 'prop.rail.pier', kind: 'prop', tags: ['transit', 'rail', 'viaduct', 'pier', 'support'], solid: true, size: p => [1.4, 1.6, p.h || 4.4], vb: p => [-.3, -2.2, 0, 1.7, 3.8, (p.h || 4.4) + .1],
    variants: [{ h: 4.4, seed: 1 }, { h: 6.4, seed: 2 }, { h: 3.4, seed: 5, poster: false }], draw: drawPier },
  { id: 'prop.rail.viaduct.truss', kind: 'prop', tags: ['transit', 'rail', 'viaduct', 'deck', 'truss', 'bridge', 'river'], solid: false, size: p => [p.len || 16, DW, BED], vb: p => [-.1, -.3, -2.1, (p.len || 16) + .1, DW + .2, 5.2],
    variants: [{ len: 16 }, { len: 24, color: '#3f7f7a' }], draw: drawTruss },
  { id: 'prop.rail.arch', kind: 'prop', tags: ['transit', 'rail', 'viaduct', 'arch', 'support', 'oldtown', 'shop'], solid: true, size: p => [p.len || 8, DW, p.h || 4.4], door: { side: 'y', at: 5.9 },
    light: { x: 4, y: 7, z: 0, r: 4 },
    variants: [{ infill: 'shop', name: 'CAFE', seed: 1 }, { infill: 'shop', name: 'BIKES', front: '#31556b', seed: 2 }, { infill: 'garage', seed: 3 }, { infill: 'brick', seed: 4 }, { infill: 'shop', name: 'RECORDS', front: '#8a3a4a', color: '#b86a48', seed: 5 }],
    draw: p => drawArch(p, false) },
  { id: 'prop.rail.arch.open', kind: 'prop', tags: ['transit', 'rail', 'viaduct', 'arch', 'support', 'oldtown', 'passage'], solid: false, size: p => [p.len || 8, DW, p.h || 4.4],
    variants: [{}, { color: '#b86a48' }], draw: p => drawArch(p, true) },
  { id: 'prop.rail.track', kind: 'prop', tags: ['transit', 'rail', 'track', 'ground'], solid: false, size: p => [p.len || 8, p.tracks === 2 ? 5.2 : 2.6, .15], vb: p => [0, 0, 0, p.len || 8, (p.tracks === 2 ? 5.2 : 2.6) + .2, .3],
    variants: [{ len: 8 }, { len: 8, tracks: 2 }], draw: drawTrack },
  { id: 'prop.rail.buffer', kind: 'prop', tags: ['transit', 'rail', 'track', 'buffer'], solid: true, size: [1.2, 2.6, 1.4], variants: [{}],
    draw() {
      drawTrack({ len: 1.2 });
      for (const y of [1.3 - G, 1.3 + G]) { fq([[.1, y, .1], [.9, y, .1], [.9, y, 1.0]], '#6b5a4a'); lw([.1, y, .1], [.9, y, 1.0], '#3a3644'); box(.86, y - .06, .1, .12, .12, 1.0, '#4a4856'); }
      box(.8, .35, .78, .2, 1.9, .34, '#e0453a', { l: PAT.vstripes('#e0453a', '#f6f2e6', 4), r: PAT.vstripes('#c93a30', '#d9d4c8', 4) });
      lamp(.9, 1.3, 1.26, '#ff3b3b', 3, 2, 2);
    } },
  { id: 'prop.rail.signal', kind: 'prop', tags: ['transit', 'rail', 'signal'], solid: true, size: [.3, .3, 4.3], vb: [-.3, -.3, 0, .7, .9, 4.6],
    variants: [{ state: 'green' }, { state: 'red' }, { state: 'amber' }],
    draw(p) {
      const st = p.state || 'red';
      box(0, 0, 0, .3, .3, .3, '#4a4856'); box(.09, .09, .3, .12, .12, 3.0, STEEL);
      for (let z = .6; z < 3.2; z += .3) lw([.21, .3, z], [.21, .42, z], '#8d939e'); lw([.21, .42, .5], [.21, .42, 3.3], '#8d939e');     // ladder
      box(-.08, .02, 3.2, .46, .26, 1.05, '#25212d'); qy(-.08, .38, .285, 4.25, 4.33, '#25212d');
      [['red', '#ff3b3b', 3.95], ['amber', '#ffb347', 3.65], ['green', '#4dff88', 3.35]].forEach(([k, c, z]) => {
        if (k === st) { halo(.15, .29, z, 5, lt(c, .3)); lit(() => disc('y', .15, .29, z, .11, c)); } else disc('y', .15, .29, z, .11, dk(c, .72));
      });
      qy(-.02, .32, .31, 2.6, 2.95, '#f6f2e6'); textY(String(p.num || 'A4').slice(0, 2), .02, .31, 2.93, '#25212d');
    } },
  { id: 'prop.rail.crossing', kind: 'prop', tags: ['transit', 'rail', 'crossing', 'gate'], solid: true, size: [.5, .5, 3.6], vb: p => [-.3, -.4, 0, (p.len || 4) + .9, 1, 5.2],
    variants: [{ open: false }, { open: true }, { open: false, len: 6 }],
    draw(p) {
      const Lb = p.len || 4, open = !!p.open, y = .25;
      box(.05, .05, 0, .4, .4, 1.0, '#f2c230', { l: PAT.stripes('#f2c230', '#25212d', 3) }); box(.17, .17, 1.0, .16, .16, 2.3, '#c9ced6');
      // crossbuck
      for (const s of [1, -1]) fq([[.25 - .55, .34, 3.1 - .55 * s - .06], [.25 + .55, .34, 3.1 + .55 * s - .06], [.25 + .55, .34, 3.1 + .55 * s + .06], [.25 - .55, .34, 3.1 - .55 * s + .06]], '#f6f2e6');
      for (const s of [1, -1]) { lw([.25 - .55, .34, 3.1 - .55 * s - .07], [.25 + .55, .34, 3.1 + .55 * s - .07], '#c93a30'); }
      box(-.2, .16, 2.2, .9, .12, .08, '#25212d', { ol: false });
      for (const x of [-.08, .58]) { disc('y', x, .345, 2.24, .17, '#25212d'); if (!open) { halo(x, .35, 2.24, 5, '#ff7a6a'); lit(() => disc('y', x, .35, 2.24, .11, '#ff3b3b')); } else disc('y', x, .35, 2.24, .11, '#5a2026'); }
      // boom
      const a = open ? 1.35 : 0, cx = Math.cos(a), sz = Math.sin(a), n = Math.ceil(Lb / .5);
      box(-.25, y + .12, .95, .3, .1, .3, '#4a4856', { ol: false });
      for (let i = 0; i < n; i++) { const t0 = i * .5, t1 = Math.min(Lb, t0 + .5), c = i % 2 ? '#f6f2e6' : '#e0453a';
        fq([[.25 + t0 * cx - .07 * sz * 0, y + .2, 1.05 + t0 * sz - .07], [.25 + t1 * cx, y + .2, 1.05 + t1 * sz - .07], [.25 + t1 * cx - .14 * sz, y + .2, 1.05 + t1 * sz + .07 * cx + .07 * (1 - cx)], [.25 + t0 * cx - .14 * sz, y + .2, 1.05 + t0 * sz + .07 * cx + .07 * (1 - cx)]], c); }
      lw([.25, y + .2, 1.05 - .07], [.25 + Lb * cx, y + .2, 1.05 + Lb * sz - .07], '#7a2a26');
      if (!open) { lamp(.25 + Lb * .5, y + .2, 1.2, '#ff3b3b', 2, 2, 2); lamp(.25 + Lb - .1, y + .2, 1.2, '#ff3b3b', 2, 2, 2); }
    } },
];
function at0(fn) { fn(); }
