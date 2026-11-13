// Bathroom fixtures. Everything stands against the back wall (y=0) and faces +y.
import { box, qy, qx, qz, lw, glow, lit, cyl, ball, rng, dk, lt } from '../../engine/raster.js';
import { tier, wood, FAB, METAL, WHITE, b, leg, legs4, pole, shadow, drawersY, doorsY, dot, blob, oblob, mug, frameY, frameX, fabric, stock } from './_lib.js';

const GOLD = '#d9b65c', PORC = '#f4f1ea';
const mirrorY = (x0, x1, y, z0, z1, fr) => { qy(x0, x1, y, z0, z1, '#bcd9e4', '#c9e3ec'); lw([x0 + (x1 - x0) * .2, y, z1 - .06], [x0 + (x1 - x0) * .2 + .22, y, z1 - .06 - .3], '#eef8fb'); lw([x0 + (x1 - x0) * .2 + .08, y, z1 - .06], [x0 + (x1 - x0) * .2 + .22, y, z1 - .24], '#eef8fb'); frameY(x0, x1, y, z0, z1, fr); };
function shower(p) {
  const t = tier(p), m = p.metal || ['#c2cad0', '#c2cad0', '#2c2738'][t], H = 2.05, c = p.c || FAB.teal;
  box(0, 0, 0, 1, 1, .1, PORC, { t: (x, y) => (x > .08 && x < .92 && y > .08 && y < .92) ? '#e3dfd6' : PORC }); dot(.5, .5, .1, '#8e979d');
  // riser + head + shelf (against the back wall)
  pole(.5, .05, .1, t === 2 ? 1.95 : 1.75, m); if (t === 2) { box(.32, .05, 1.98, .36, .3, .04, m); } else { lw([.5, .05, 1.85], [.5, .22, 1.8], m); b(.44, .2, 1.74, .12, .1, .05, m); }
  dot(.5, .06, 1.0, t === 2 ? GOLD : '#eef2f5'); dot(.5, .06, 1.0, t === 2 ? GOLD : '#eef2f5', 1, 0);
  b(.74, .02, 1.05, .2, .1, .03, m); b(.76, .03, 1.08, .05, .06, .12, '#8fd0b0'); b(.84, .03, 1.08, .05, .06, .09, '#f4a261');
  if (p.on) lit(() => { for (let i = 0; i < 5; i++) for (let z = .3; z < 1.7; z += .22) dot(.4 + i * .05, .25 + (i % 2) * .1, z + (i % 3) * .07, '#cfeeff'); });
  if (t === 0) { // curtain on a rail
    pole(.98, .98, .1, H - .1, m); lw([0, .98, H], [.98, .98, H], m); lw([.98, 0, H], [.98, .98, H], dk(m, .2));
    qy(0, .62, .98, .22, H - .04, (u, v) => (u % 5 === 4) ? dk(c, .3) : ((u % 5 === 2 && v % 6 === 3) ? lt(c, .5) : dk(c, .12))); for (let x = .06; x < .62; x += .12) dot(x, .98, H - .02, '#f8f5ee');
    qx(.98, 0, .3, .22, H - .04, (u, v) => (u % 5 === 4) ? dk(c, .45) : dk(c, .3));
  } else {
    const gl = '#d4ecf4';
    qx(1, 0, 1, .1, H, gl, 'glass'); qy(0, 1, 1, .1, H, gl, 'glass');
    lw([.15, 1, 1.8], [.4, 1, 1.3], '#f4fbfd'); lw([.25, 1, 1.8], [.4, 1, 1.5], '#f4fbfd');
    frameY(0, 1, 1, .1, H, m); frameX(1, 0, 1, .1, H, m); if (t === 1) lw([.5, 1, .1], [.5, 1, H], m); lw([t === 1 ? .56 : .9, 1, .95], [t === 1 ? .56 : .9, 1, 1.2], t === 2 ? GOLD : '#eef2f5');
    if (t === 2) { lw([0, 1, 1.4], [1, 1, 1.4], m); lw([1, 0, 1.4], [1, 1, 1.4], m); lw([1, .5, .1], [1, .5, H], m); }
  }
}
function bathtub(p) {
  const t = tier(p), c = p.c || PORC, m = t === 2 ? GOLD : '#c2cad0', H = t === 2 ? .62 : .56;
  shadow(-.02, 2.06, 0, 1.06);
  if (t === 2) { for (const [x, y] of [[.2, .16], [1.8, .16], [.2, .86], [1.8, .86]]) { leg(x, y, 0, .12, GOLD); } box(.04, .06, .1, 1.92, .88, H - .1, c, { l: dk(p.c2 || c, .12), r: dk(p.c2 || c, .3) }); }
  else if (t === 1) box(0, 0, 0, 2, 1, H, c, { l: (u, v) => (u % 8 === 0 || v % 8 === 0) ? dk(p.c2 || '#9fc8d8', .25) : (p.c2 || '#9fc8d8'), r: (u, v) => (u % 8 === 0 || v % 8 === 0) ? dk(p.c2 || '#9fc8d8', .45) : dk(p.c2 || '#9fc8d8', .25) });
  else box(0, 0, 0, 2, 1, H, c);
  const i = t === 2 ? .14 : .1, full = p.full !== false;
  qz(i, 2 - i, i + (t === 2 ? .06 : 0), 1 - i, H + .005, full ? '#9fd8ea' : '#d9d5cb'); if (full) qz(i, 2 - i, i + (t === 2 ? .06 : 0), i + .14, H + .005, '#7fbcd2');
  if (!full) { qz(i + .06, 2 - i - .06, i + .2, 1 - i - .06, H + .005, '#c9c5bb'); dot(1.6, .5, H, '#8e979d'); }
  if (full && (t || p.bubbles)) { for (const [x, y, r] of [[.5, .4, 4], [.8, .6, 5], [1.2, .45, 4], [1.5, .65, 3.4], [.35, .7, 3], [1.0, .3, 3]]) blob(x, y, H + .02, r, r * .5, '#f8fbfd'); dot(.8, .6, H + .06, '#ffffff'); }
  if (full) { dot(.62, .72, H + .03, '#f2c13a'); dot(.62, .72, H + .03, '#f2c13a', 1, 0); dot(.62, .72, H + .03, '#f2c13a', 1, -1); dot(.62, .72, H + .03, '#e8563a', 2, -1); }
  pole(1.9, .5, H, .2, m); lw([1.9, .5, H + .2], [1.78, .5, H + .16], m); dot(1.9, .38, H + .04, t === 2 ? GOLD : FAB.red); dot(1.9, .62, H + .04, t === 2 ? GOLD : FAB.blue);
  if (t) { b(.04, .04, H, .1, .08, .12, '#8fd0b0'); b(.16, .04, H, .08, .08, .09, FAB.rose); }
  if (t === 2) { cyl(.1, .9, H, .04, .1, '#f8f5ee', { ol: false }); dot(.1, .9, H + .14, '#ffb04a'); glow(() => { dot(.1, .9, H + .14, '#ffe9a8'); dot(.1, .9, H + .14, '#fff8e0', 0, -1); }); }
}
function toilet(p) {
  const t = tier(p), c = p.c || PORC, sc = t === 0 ? (p.c2 || '#b08a5a') : c;
  shadow(.02, .5, 0, .86);
  box(.06, 0, t === 2 ? .2 : .38, .38, .22, t === 2 ? .64 : .42, c); dot(.25, .11, t === 2 ? .84 : .8, t === 2 ? GOLD : '#c2cad0'); if (t !== 2) lw([.1, .22, .78], [.4, .22, .78], dk(c, .2));
  if (t === 2) lit(() => dot(.4, .22, .7, '#8ad8ff'));
  qy(.1, .4, .23, .44, .78, sc); frameY(.1, .4, .23, .44, .78, dk(sc, .4));
  box(.15, .26, 0, .2, .4, .26, c); cyl(.25, .52, .26, .2, .14, c, { t: sc }); blob(.25, .52, .405, 3.8, 1.9, lt(sc, .3)); blob(.25, .52, .4, 2.6, 1.2, '#a8d8e8');
  if (t === 0) { lw([.02, .7, 0], [.02, .7, .34], '#8a5a3a'); cyl(.02, .7, 0, .06, .06, '#c8574d', { ol: false }); }
  if (t >= 1) { cyl(.46, .1, .5, .05, .1, '#f8f5ee', { ol: false }); dot(.46, .1, .56, '#b9c2c9'); }
}
function bathSink(p) {
  const t = tier(p), wd = p.wood || ['#f1eee6', '#e9e2d2', '#3b4560'][t], m = t === 2 ? GOLD : '#c2cad0', W = p.len || 1, H = .82, mx = W / 2;
  shadow(-.02, W + .05, 0, .58);
  // mirror on the wall
  if (t === 0) { mirrorY(mx - .25, mx + .25, .02, 1.15, 1.75, '#8e979d'); b(mx - .3, 0, 1.06, .6, .1, .03, '#c2cad0'); mug(mx - .2, .06, 1.09, FAB.teal); dot(mx - .2, .06, 1.2, FAB.red); }
  else if (t === 1) { box(mx - .36, 0, 1.08, .72, .04, .78, wood(p)); mirrorY(mx - .31, mx + .31, .045, 1.13, 1.81, dk(wood(p), .3)); }
  else { glow(() => box(.06, 0, 1.04, W - .12, .03, .86, '#fff2c4', { ol: false })); mirrorY(.12, W - .12, .035, 1.1, 1.84, GOLD); }
  if (t === 0) { box(mx - .1, .14, 0, .2, .2, H - .16, PORC); box(mx - .34, .02, H - .16, .68, .46, .16, PORC, { t: (x, y) => (Math.abs(x - mx) < .24 && y > .14 && y < .4) ? '#d9d5cb' : PORC }); }
  else {
    box(0, 0, t === 2 ? .2 : 0, W, .46, H - .08 - (t === 2 ? .2 : 0), wd); if (t === 2) { drawersY(.03, W - .03, .46, .23, H - .1, 2, wd, GOLD); } else doorsY(.03, W - .03, .46, .03, H - .1, 2, wd, m);
    box(0, 0, H - .08, W, .5, .08, t === 2 ? '#f3f0ea' : PORC, { t: (x, y) => (Math.abs(x - mx) < .26 && y > .14 && y < .42) ? (t === 2 ? '#f3f0ea' : '#d9d5cb') : (t === 2 && Math.abs(((x * 1.3 + y * 2.3) % .8) - .4) < .025 ? '#d4d0d8' : (t === 2 ? '#f3f0ea' : PORC)) });
    if (t === 2) { cyl(mx, .28, H, .2, .1, PORC, { t: '#d9d5cb' }); }
  }
  blob(mx, .28, H + (t === 2 ? .1 : 0) + .005, 2.4, 1.1, '#a8d8e8');
  pole(mx, .07, H, .2, m); lw([mx, .07, H + .2], [mx, .18, H + .18], m);
  if (t) { b(W - .16, .08, H, .07, .07, .13, '#8fd0b0'); dot(W - .13, .11, H + .16, '#3a3a46'); mug(.1, .12, H, FAB.rose); dot(.1, .12, H + .18, FAB.blue); dot(.1, .12, H + .18, '#f8f5ee', 1, -1); }
}
function washer(p) {
  const t = tier(p), c = p.c || ['#e9e4d6', '#f4f1ea', '#4a4a58'][t], W = 1;
  shadow(-.02, 1.05, 0, .58);
  b(.03, .03, 0, .94, .42, .05, dk(c, .6)); box(0, 0, .04, W, .5, .84, c, { t: lt(c, .1) });
  lw([0, .5, .74], [1, .5, .74], dk(c, .35));
  if (t === 0) { // top loader: lid + dial
    qz(.1, .9, .08, .44, .885, dk(c, .08)); lw([.1, .44, .885], [.9, .44, .885], dk(c, .35)); dot(.2, .5, .81, '#3a3a46'); dot(.2, .5, .81, '#3a3a46', 1, 0); dot(.4, .5, .81, '#8e979d'); dot(.5, .5, .81, '#8e979d'); qy(.1, .9, .5, .1, .14, dk(c, .2));
    dot(.7, .5, .5, dk(c, .3)); dot(.3, .5, .3, dk(c, .2));
  } else {
    blob(.5, .5, .4, 5.5, 5.5, t === 2 ? GOLD : '#c2cad0'); blob(.5, .5, .4, 4.4, 4.4, '#2c3442');
    if (p.on) lit(() => { blob(.5, .5, .4, 3.6, 3.6, '#7fc8e0'); blob(.5, .5, .36, 2.4, 1.6, p.c2 || FAB.red); dot(.5, .5, .46, '#f8fbfd', -1, 0); dot(.5, .5, .46, '#f8fbfd', 1, -1); });
    else { blob(.5, .5, .36, 2.6, 1.6, p.c2 || FAB.blue); dot(.5, .5, .4, '#6f7f95', -2, -3); dot(.5, .5, .4, '#6f7f95', -3, -2); }
    qy(.08, .36, .5, .77, .85, dk(c, .15)); dot(.78, .5, .81, t === 2 ? GOLD : '#8e979d'); dot(.78, .5, .81, t === 2 ? GOLD : '#8e979d', 1, 0); lit(() => { dot(.56, .5, .81, p.on ? '#8dffb0' : '#58c27a'); dot(.62, .5, .81, '#8ad8ff'); });
  }
  if (p.basket !== false && t) { cyl(.3, .25, .88, .16, .16, '#d9b98a', { t: '#f1eee6' }); blob(.3, .25, 1.06, 4, 2, FAB.rose); blob(.34, .25, 1.07, 2, 1.4, '#f8f5ee'); b(.72, .14, .88, .14, .1, .2, FAB.blue); b(.75, .16, 1.08, .06, .06, .05, '#f8f5ee'); }
  if (t === 0) { b(.66, .14, .89, .2, .14, .16, '#f2c13a'); qy(.68, .84, .28, .93, 1.02, FAB.red); }
}
function towelRack(p) {
  const t = tier(p), m = p.metal || METAL[t], cs = p.cs || [[FAB.blue], [FAB.teal, FAB.cream], ['#f8f5ee', FAB.rose, '#f8f5ee']][t];
  const towel = (x0, x1, z1, len, c) => { box(x0, .03, z1 - len, x1 - x0, .06, len, c, { l: (u, v, w, h) => (v === 2 || v === 4) ? lt(c, .4) : dk(c, .14), ol: true }); };
  if (t === 0) { box(0, 0, .5, 1, .04, .1, wood(p)); for (const x of [.2, .5, .8]) dot(x, .06, .52, '#3a3a46'); towel(.1, .4, .56, .5, cs[0]); }
  else if (t === 1) { lw([.05, .08, .1], [.05, .08, .78], m); lw([.95, .08, .1], [.95, .08, .78], m); for (const z of [.25, .5, .75]) lw([.05, .08, z], [.95, .08, z], lt(m, .2)); towel(.12, .52, .77, .36, cs[0]); towel(.5, .88, .52, .3, cs[1]); }
  else { for (let z = .06; z < .8; z += .12) lw([.05, .06, z], [.95, .06, z], m); lw([.05, .06, 0], [.05, .06, .8], m); lw([.95, .06, 0], [.95, .06, .8], m); towel(.12, .5, .8, .4, cs[0]); towel(.54, .9, .56, .34, cs[1]); glow(() => dot(.9, .08, .03, '#ff8a5a')); }
}
function bathMat(p) {
  const t = tier(p), c = p.c || FAB.teal, c2 = p.c2 || '#f8f5ee';
  qz(.06, .94, .05, .45, .012, t === 0 ? c : t === 1 ? fabric(c, c2, 'xstripe', .12) : ((x, y) => { const dx = Math.abs(x - .5), dy = Math.abs(y - .25); return (dx > .36 || dy > .14) ? c2 : (dx < .1 && dy < .07) ? c2 : c; }));
  lw([.06, .45, .012], [.94, .45, .012], dk(c, .4)); lw([.94, .05, .012], [.94, .45, .012], dk(c, .4));
  if (t) for (let x = .08; x < .94; x += .12) { dot(x, .47, 0, c2); }
}

const B = (id, tags, o) => Object.assign({ id: 'furn.home.bath.' + id, kind: 'furniture', tags: ['home', 'bath', ...tags] }, o);
const T3 = [{ tier: 0 }, { tier: 1 }, { tier: 2 }];
export default [
  B('shower', ['shower'], { size: [1, 1, 2.1], use: { x: .5, y: 1.35 }, seats: [{ x: .5, y: .5, z: .1, dir: 1, stand: true }], variants: [{ tier: 0 }, { tier: 1 }, { tier: 2 }, { tier: 1, on: true }, { tier: 0, c: FAB.mustard }], draw: shower }),
  B('bathtub', ['bath', 'shower'], { size: [2, 1, .6], vb: [-.3, -.3, 0, 2.3, 1.3, 1.1], use: { x: 1, y: 1.35 }, seats: [{ x: .95, y: .5, z: .15, dir: 0, lie: true }], variants: [{ tier: 0, full: false }, { tier: 1 }, { tier: 2 }, { tier: 1, c2: '#e9a8b8' }, { tier: 2, c2: '#3b4560' }], draw: bathtub }),
  B('toilet', ['toilet'], { size: [.5, 1, .85], use: { x: .25, y: 1.3 }, seats: [{ x: .25, y: .52, z: .42, dir: 1 }], variants: T3, draw: toilet }),
  B('sink', ['sink', 'mirror'], { size: p => [p.len || 1, .5, .85], vb: p => [-.3, -.3, 0, (p.len || 1) + .3, .8, 2], use: { x: .5, y: .85 }, light: { x: .5, y: .6, z: 0, r: 1.5 }, variants: [{ tier: 0 }, { tier: 1 }, { tier: 2 }, { tier: 2, len: 1.5, wood: '#5e3f30' }, { tier: 1, wood: '#7fa08c' }], draw: bathSink }),
  B('washer', ['laundry'], { size: [1, .5, .9], vb: [-.3, -.3, 0, 1.3, .8, 1.5], use: { x: .5, y: .85 }, variants: [{ tier: 0 }, { tier: 1 }, { tier: 2, on: true }, { tier: 1, on: true, basket: false }], draw: washer }),
  B('towelrack', ['towel'], { size: [1, .1, .8], wall: true, mount: .7, solid: false, variants: T3, draw: towelRack }),
  B('mat', ['rug', 'bathmat'], { size: [1, .5, .02], vb: [-.1, -.1, 0, 1.1, .6, .1], solid: false, variants: [{ tier: 0 }, { tier: 1, c: FAB.blue }, { tier: 2, c: FAB.rose }, { tier: 1, c: FAB.mustard }], draw: bathMat }),
];
