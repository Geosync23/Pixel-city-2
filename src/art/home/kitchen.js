// Kitchen: counter line is 0.5 deep, 0.8 high, modules 1 wide. Everything faces +y (stands against the back wall).
// Countertop appliances (microwave, coffee, clutter, dishrack) include a counter module by default; pass base:false to get
// just the appliance (sits at local z=0, place it on any surface: counter top is z=.8, tables .75).
import { box, qy, qx, qz, lw, glow, lit, cyl, rng, dk, lt, mix } from '../../engine/raster.js';
import { tier, wood, WHITE, FAB, METAL, b, leg, pole, shadow, panelY, frameY, doorsY, drawersY, dot, blob, oblob, mug, stock, shelfUnit, JARC } from './_lib.js';

export const CH = .8;
export const kcol = p => { const t = tier(p); return { t, cab: p.c || ['#d9c8a0', '#7fa08c', '#3b4560'][t], top: p.top || ['#a3a5ab', '#c99b62', '#f3f0ea'][t], hd: p.metal || METAL[t] }; };
const topPat = (k) => k.t === 2 ? ((x, y) => Math.abs(((x * 1.3 + y * 2.3) % .8) - .4) < .025 ? dk(k.top, .16) : k.top) : k.t === 1 ? ((x, y) => (y % .17) < .03 ? dk(k.top, .16) : k.top) : k.top;
/** counter run from x0, len modules. o.plain: no door detail. o.kinds: per-module 'd' doors / 'w' drawers / 'o' open / '-' blank */
export function counter(x0, len, p, o) {
  o = o || {}; const k = kcol(p), n = Math.round(len);
  b(x0, 0, 0, len, .44, .08, dk(k.cab, .55)); box(x0, 0, .08, len, .5, .66, k.cab);
  for (let i = 0; i < n; i++) {
    const x = x0 + i, kd = o.kinds ? o.kinds[i] : (p.drawers ? 'w' : ((i + (p.seed || 0)) % 3 === 1 ? 'w' : 'd'));
    if (i) lw([x, .5, .08], [x, .5, .74], dk(k.cab, .5));
    if (kd === 'w') drawersY(x + .05, x + .95, .5, .1, .73, 3, k.cab, k.hd);
    else if (kd === 'd') { lw([x + .03, .5, .57], [x + .97, .5, .57], dk(k.cab, .42)); lw([x + .36, .5, .65], [x + .64, .5, .65], k.hd); doorsY(x + .03, x + .97, .5, .1, .57, 2, k.cab, k.hd); }
  }
  box(x0, 0, .74, len, .54, .06, k.top, { t: topPat(k) });
}

/* ---- small appliances, drawn at (x,y,z) = min corner of their own little footprint ---- */
function microwave(x, y, z, p) {
  const t = tier(p), c = p.ac || ['#e6e1d4', '#c2cad0', '#4a4a5a'][t];
  box(x, y, z, .7, .36, .36, c); if (t === 2) lw([x + .52, y + .36, z + .06], [x + .52, y + .36, z + .31], '#d9b65c'); qy(x + .05, x + .5, y + .36, z + .06, z + .31, '#2c3442'); frameY(x + .05, x + .5, y + .36, z + .06, z + .31, dk(c, .5));
  if (p.on) lit(() => { qy(x + .07, x + .48, y + .36, z + .08, z + .29, '#ffc66a', '#ffb04a'); qy(x + .2, x + .36, y + .36, z + .1, z + .16, '#f7f1e3'); });
  else dot(x + .1, y + .36, z + .27, '#6f7f95');
  lit(() => dot(x + .6, y + .36, z + .28, p.on ? '#8dffb0' : '#58c27a'));
  dot(x + .56, y + .36, z + .18, dk(c, .45)); dot(x + .63, y + .36, z + .18, dk(c, .45)); dot(x + .56, y + .36, z + .1, dk(c, .45)); dot(x + .63, y + .36, z + .1, t === 2 ? '#d9b65c' : dk(c, .45));
}
function coffee(x, y, z, p) {
  const t = tier(p), c = p.ac || ['#3a3a46', FAB.red, '#c8ced3'][t];
  if (t === 0) { // drip machine + glass carafe
    box(x, y, z, .34, .3, .06, c); box(x, y, z + .06, .12, .3, .34, c); box(x, y, z + .4, .34, .3, .1, c);
    b(x + .16, y + .08, z + .06, .15, .16, .16, '#5a3a2a', { t: '#3a241a' }); qy(x + .16, x + .31, y + .24, z + .16, z + .22, '#cfe3ea'); lit(() => dot(x + .05, y + .3, z + .12, '#ff7a5a'));
  } else if (t === 1) { // pod machine
    box(x + .04, y, z, .26, .34, .08, dk(c, .3)); box(x + .04, y, z + .08, .26, .2, .32, c); box(x + .04, y, z + .4, .26, .34, .1, c, { t: lt(c, .25) });
    mug(x + .17, y + .3, z + .08, '#f8f5ee'); lit(() => dot(x + .24, y + .34, z + .45, '#8dffb0')); dot(x + .1, y + .34, z + .45, '#f1eee6');
  } else { // espresso machine
    box(x, y, z, .6, .34, .06, dk(c, .4)); box(x, y, z + .06, .6, .18, .26, dk(c, .2)); box(x, y, z + .32, .6, .36, .16, c, { t: lt(c, .2) });
    lw([x + .2, y + .36, z + .3], [x + .2, y + .36, z + .24], '#3a3a46'); lw([x + .14, y + .36, z + .24], [x + .26, y + .36, z + .24], '#d9b65c'); lw([x + .5, y + .36, z + .32], [x + .54, y + .4, z + .14], '#e6ebef');
    mug(x + .18, y + .3, z + .06, '#f8f5ee'); mug(x + .08, y + .12, z + .48, '#f8f5ee'); mug(x + .22, y + .12, z + .48, '#f8f5ee'); mug(x + .36, y + .12, z + .48, '#e9c9a0');
    lit(() => { dot(x + .36, y + .36, z + .41, '#ffb04a'); dot(x + .42, y + .36, z + .41, '#8dffb0'); }); dot(x + .08, y + .36, z + .41, '#3a3a46'); dot(x + .12, y + .36, z + .41, '#3a3a46');
  }
}
function toaster(x, y, z, p) {
  const t = tier(p), c = p.ac || ['#e6e1d4', FAB.teal, '#c8ced3'][t];
  box(x, y, z, .32, .2, .2, c, { t: lt(c, .2) }); lw([x + .06, y + .07, z + .2], [x + .26, y + .07, z + .2], '#3a3038'); lw([x + .06, y + .14, z + .2], [x + .26, y + .14, z + .2], '#3a3038');
  b(x + .1, y + .06, z + .2, .14, .03, .07, '#d9a45a', { t: '#b9763a' }); dot(x + .32, y + .1, z + .12, '#3a3038'); dot(x + .32, y + .1, z + .1, '#3a3038');
}
function kettle(x, y, z, p) {
  const t = tier(p), c = p.kc || ['#e6e1d4', FAB.mustard, '#c98a5a'][t];
  cyl(x + .12, y + .12, z, .1, .2, c, { t: lt(c, .3) }); blob(x + .12, y + .12, z + .22, 1, 1, dk(c, .55));
  lw([x + .03, y + .2, z + .2], [x - .03, y + .22, z + .14], '#3a3038'); lw([x - .03, y + .22, z + .14], [x + .03, y + .2, z + .05], '#3a3038'); dot(x + .22, y + .08, z + .17, dk(c, .3), 1, 0);
}
function dishrack(x, y, z, p) {
  const t = tier(p), m = p.ac || ['#e6e1d4', '#c2cad0', '#a98a5a'][t];
  box(x, y, z, .6, .36, .04, dk(m, .1));
  pole(x + .02, y + .02, z, .2, m); pole(x + .58, y + .02, z, .2, m); lw([x + .02, y + .02, z + .2], [x + .58, y + .02, z + .2], m);
  for (let i = 0; i < 4; i++) { const xx = x + .1 + i * .09; qx(xx, y + .07, y + .29, z + .05, z + .26, i % 2 ? '#f8f5ee' : (p.c2 || '#bfe0ea')); frameX(xx, y + .07, y + .29, z + .05, z + .26, '#8d95a8'); }
  mug(x + .48, y + .22, z + .05, FAB.red); mug(x + .5, y + .32, z + .05, FAB.mustard);
  pole(x + .02, y + .34, z, .2, m); pole(x + .58, y + .34, z, .2, m); lw([x + .02, y + .34, z + .2], [x + .58, y + .34, z + .2], lt(m, .3)); lw([x + .58, y + .02, z + .2], [x + .58, y + .34, z + .2], lt(m, .3));
}
function frameX(x, y0, y1, z0, z1, c) { lw([x, y0, z0], [x, y1, z0], c); lw([x, y0, z1], [x, y1, z1], c); lw([x, y0, z0], [x, y0, z1], c); lw([x, y1, z0], [x, y1, z1], c); }

const onCounter = (id, tags, itemH, drawItem, variants, extra) => Object.assign({
  id: 'furn.home.kitchen.' + id, kind: 'furniture', tags: ['home', 'kitchen', ...tags],
  size: p => p.base === false ? [1, .5, itemH] : [1, .5, CH + itemH], use: { x: .5, y: .85 }, variants, surface: true,
  draw(p) { if (p.base === false) drawItem(p, 0); else { counter(0, 1, p); drawItem(p, CH); } },
}, extra);

function fridge(p) {
  const t = tier(p), c = p.c || ['#ece6d6', '#b9c2c9', '#3d4150'][t], hd = t === 2 ? '#d9b65c' : t ? '#eef2f5' : '#9aa3a8', H = 1.7, r = rng(p.seed || 3);
  shadow(-.03, 1.06, 0, .58);
  b(.02, .02, 0, .96, .44, .06, dk(c, .6)); box(0, 0, .05, 1, .5, H - .05, c, { t: lt(c, .1) });
  const seam = dk(c, .45);
  if (t === 0) { // top freezer, magnets and notes
    lw([0, .5, 1.25], [1, .5, 1.25], seam); lw([.1, .5, 1.32], [.1, .5, 1.52], hd); lw([.1, .5, .7], [.1, .5, 1.15], hd);
    qy(.5, .68, .5, .85, 1.05, '#fff8e0'); dot(.59, .5, 1.05, FAB.red); qy(.72, .86, .5, .62, .8, '#bfe0ea'); dot(.79, .5, .8, FAB.mustard);
    for (let i = 0; i < 3; i++) dot(.35 + r() * .5, .5, 1.3 + r() * .3, [FAB.red, FAB.teal, FAB.mustard][i]);
    lw([.86, .5, .3], [.86, .5, .31], dk(c, .25));
  } else if (t === 1) { // bottom freezer drawer, long handle, small display
    lw([0, .5, .6], [1, .5, .6], seam); lw([.12, .5, .7], [.12, .5, 1.5], hd); lw([.13, .5, .7], [.13, .5, 1.5], dk(c, .3)); lw([.3, .5, .5], [.7, .5, .5], hd);
    qy(.62, .82, .5, 1.3, 1.42, '#2c3442'); lit(() => { dot(.68, .5, 1.38, '#8ad8ff'); dot(.74, .5, 1.35, '#8ad8ff'); });
    if (p.c) { qy(.5, .66, .5, .9, 1.08, '#fff8e0'); dot(.58, .5, 1.08, FAB.red); }
  } else { // french doors + drawer, dispenser
    lw([0, .5, .62], [1, .5, .62], seam); lw([.5, .5, .62], [.5, .5, H], seam); lw([.44, .5, .8], [.44, .5, 1.5], hd); lw([.56, .5, .8], [.56, .5, 1.5], hd); lw([.25, .5, .52], [.75, .5, .52], hd); lw([.25, .5, .3], [.75, .5, .3], dk(c, .3));
    qy(.14, .34, .5, 1.05, 1.4, '#22252f'); frameY(.14, .34, .5, 1.05, 1.4, lt(c, .25)); lit(() => { qy(.18, .3, .5, 1.3, 1.36, '#8ad8ff'); dot(.24, .5, 1.12, '#bfefff'); });
  }
  lw([1, .5, .06], [1, .5, H], lt(c, .3));
}
function stove(p) {
  const t = tier(p), c = p.c || ['#ece6d6', '#c2cad0', '#33343f'][t], hd = t === 2 ? '#d9b65c' : '#eef2f5', hc = p.hoodc || ['#e6e1d4', '#b9c2c9', '#c2cad0'][t];
  shadow(-.03, 1.06, 0, .58);
  b(.02, .02, 0, .96, .44, .06, dk(c, .6)); box(0, 0, .05, 1, .5, .73, c);
  qy(.12, .88, .5, .16, .5, '#2a2c38'); frameY(.12, .88, .5, .16, .5, dk(c, .5)); lw([.14, .5, .56], [.86, .5, .56], hd); dot(.2, .5, .46, '#59607a'); dot(.26, .5, .44, '#59607a');
  if (p.on) lit(() => { qy(.16, .84, .5, .2, .46, '#ff9a3c', '#ffb85a'); qy(.3, .7, .5, .26, .34, '#8a4a2a'); });
  for (let i = 0; i < 4; i++) dot(.2 + i * .2, .5, .7, t === 2 ? '#d9b65c' : '#3a3a46');
  // cooktop
  box(0, 0, .78, 1, .52, .03, t ? '#2a2c38' : lt(c, .1), { t: t ? '#2a2c38' : lt(c, .1) });
  const ring = (x, y, hot) => { blob(x, y, .815, 3, 1.5, t ? '#454a5e' : '#3a3a46'); blob(x, y, .815, 1.6, .6, t ? '#2a2c38' : '#57596a'); if (hot) lit(() => { blob(x, y, .815, 3, 1.5, '#ff7a3c'); blob(x, y, .815, 1.5, .6, '#ffc66a'); }); };
  ring(.26, .14, false); ring(.72, .14, false); ring(.26, .38, p.on && !p.pot); ring(.72, .38, false);
  if (p.pot !== false) { const pc = p.potc || (t === 2 ? '#c98a5a' : t ? FAB.red : '#8e979d'); if (p.on) lit(() => blob(.72, .38, .815, 3.6, 1.8, '#6ab8ff')); cyl(.72, .38, .82, .13, .13, pc, { t: p.on ? '#e9c9a0' : dk(pc, .5) }); lw([.86, .38, .92], [.93, .38, .92], '#3a3038'); lw([.58, .38, .92], [.52, .38, .92], '#3a3038'); if (p.on) { dot(.72, .38, 1.02, '#f4f8fb'); dot(.74, .38, 1.1, '#f4f8fb', 1, 0); } }
  if (t) { cyl(.26, .14, .82, .1, .16, '#c2cad0', { t: '#8e979d' }); dot(.3, .14, 1.0, '#3a3038', 2, 0); }
  // hood
  if (p.hood !== false) {
    if (t === 0) { box(0, 0, 1.55, 1, .42, .12, hc); lw([.1, .42, 1.6], [.4, .42, 1.6], dk(hc, .4)); lit(() => dot(.8, .42, 1.61, '#8dffb0')); }
    else { box(.3, 0, 1.75, .4, .26, .75, hc, { l: dk(hc, .1) }); box(0, 0, 1.55, 1, .5, .2, hc, { t: lt(hc, .15) }); lw([0, .5, 1.6], [1, .5, 1.6], t === 2 ? '#d9b65c' : dk(hc, .35)); lit(() => { dot(.78, .5, 1.68, '#8dffb0'); dot(.84, .5, 1.68, '#ffb04a'); }); }
    glow(() => { lw([.08, .5, 1.55], [.92, .5, 1.55], '#fff2c4'); });
  }
}
function sink(p) {
  const k = kcol(p), t = k.t, m = t === 2 ? '#d9b65c' : '#c2cad0';
  counter(0, 1, p, { kinds: 'd' });
  qz(.14, .86, .1, .44, .805, '#8e979d'); qz(.18, .82, .14, .42, .805, '#6f7885'); qz(.18, .82, .14, .22, .805, '#59606c'); qz(.2, .8, .3, .4, .805, p.water === false ? '#7f8894' : '#9fd3e6', 'glass'); dot(.5, .28, .805, '#3a3a46');
  if (t === 0) { pole(.5, .06, .8, .18, m); lw([.5, .06, .98], [.5, .2, .98], m); dot(.38, .06, .84, '#c8574d'); dot(.62, .06, .84, '#4f74b8'); }
  else { pole(.5, .06, .8, .3, m); lw([.5, .06, 1.1], [.5, .16, 1.14], m); lw([.5, .16, 1.14], [.5, .24, 1.06], m); lw([.6, .06, .8], [.6, .06, .88], m); dot(.6, .06, .88, lt(m, .4), 1, 0); }
  // soap + sponge
  b(.86, .08, .8, .07, .07, .14, t ? '#8fd0b0' : '#f4a261'); dot(.9, .12, .97, '#3a3a46'); b(.06, .34, .8, .1, .07, .04, '#f1d27a', { t: '#7fc28a' });
}
function island(p) {
  const k = kcol(p), t = k.t;
  shadow(-.03, 2.06, 0, 1.06);
  b(.07, .05, 0, 1.86, .6, .08, dk(k.cab, .55)); box(.05, .03, .08, 1.9, .66, .7, k.cab);
  lw([1, .69, .08], [1, .69, .78], dk(k.cab, .5)); doorsY(.08, .98, .69, .1, .76, 2, k.cab, k.hd); drawersY(1.05, 1.92, .69, .1, .76, 3, k.cab, k.hd);
  if (t) { leg(.06, .94, 0, .78, k.cab); leg(1.94, .94, 0, .78, k.cab); }
  box(0, 0, .78, 2, 1, .07, k.top, { t: topPat(k) });
  // fruit bowl, board
  cyl(.5, .45, .85, .17, .07, t === 2 ? '#d9b65c' : '#f1eee6', { t: '#8a6a4a' }); oblob(.46, .45, .96, 1.6, 1.6, '#e8563a'); oblob(.56, .47, .95, 1.6, 1.6, '#f2c13a'); oblob(.5, .5, .93, 1.5, 1.5, '#8fbf4a');
  box(1.2, .3, .85, .5, .34, .03, '#c99b62', { t: '#d8ac74' }); if (t) { b(1.3, .4, .88, .22, .1, .06, '#e9c9a0', { t: '#b9763a' }); lw([1.56, .4, .89], [1.72, .56, .89], '#e6ebef'); }
  if (t === 2) { cyl(1.75, .75, .85, .06, .22, '#3f8f6a', { t: '#2d6a4f' }); blob(1.75, .75, 1.14, 3, 3, '#e98aa4'); blob(1.72, .75, 1.2, 2, 2, '#f7c1d4'); }
}
function trash(p) {
  const t = tier(p), c = p.c || ['#6f8fa8', '#c2cad0', '#3a3a46'][t];
  shadow(.03, .5, .03, .5);
  if (t === 0) { cyl(.25, .25, 0, .17, .46, c, { t: '#22252f' }); blob(.25, .25, .47, 5.5, 2.6, '#22252f'); blob(.25, .25, .47, 4, 1.8, '#3a3a46'); dot(.2, .25, .47, '#f1eee6'); dot(.3, .26, .47, '#d9a45a'); lw([.1, .37, .44], [.38, .39, .44], '#22252f'); }
  else if (t === 1) { b(.3, .36, 0, .14, .08, .03, '#3a3a46'); cyl(.25, .25, .02, .17, .5, c); cyl(.25, .25, .54, .18, .04, lt(c, .2), { t: lt(c, .35) }); blob(.25, .25, .6, 1.5, .8, '#3a3a46'); }
  else { box(.08, .1, 0, .34, .3, .7, c, { t: '#c2cad0' }); lw([.08, .4, .6], [.42, .4, .6], '#d9b65c'); lit(() => dot(.36, .4, .65, '#8ad8ff')); lw([.42, .4, .04], [.42, .1, .04], lt(c, .2)); }
}
function pantry(p) {
  const t = tier(p), c = t === 0 ? (p.wood || '#8e979d') : wood(p), r = rng(p.seed || 5), H = 1.8;
  shadow(-.03, 1.06, 0, .58);
  const fillS = (i, z, g, x0, x1, y) => {
    if (i === 0) { box(x0 + .02, y - .3, z, .36, .3, Math.min(g, .26), '#c9a36a', { l: (u, v) => v % 3 === 0 ? '#a8824e' : '#c9a36a' }); stock(x0 + .44, x1, y, z, g * .8, r, ['#4f74b8', '#f1eee6', '#3f8f8a'], .8); }
    else if (i === 3) { stock(x0, x0 + .4, y, z, g * .95, r, ['#dba63c', '#c8574d', '#e98aa4', '#4f74b8'], 1); stock(x0 + .48, x1, y, z, g * .6, r, JARC, .8); }
    else stock(x0, x1, y, z, g * (i === 1 ? .7 : .85), r, i === 1 ? ['#c8574d', '#8e979d', '#dba63c', '#8fae7e'] : ['#f1e6c8', '#e9c9a0', '#d9a45a', '#b9653a', '#f1eee6'], .88);
  };
  if (t === 0) { // wire rack
    const m = c; for (const [x, y] of [[.04, .04], [.96, .04]]) pole(x, y, 0, H, dk(m, .2));
    for (let i = 0; i < 4; i++) { const z = .1 + i * .44; b(.03, .02, z - .03, .94, .46, .03, m, { t: (x, y) => (Math.floor(x * 16) & 1) ? lt(m, .25) : dk(m, .25) }); fillS(i, z, .38, .08, .92, .42); }
    for (const [x, y] of [[.04, .46], [.96, .46]]) pole(x, y, 0, H, lt(m, .2));
  } else {
    shelfUnit(0, 0, 0, 1, .5, H, c, 4, fillS, { back: t === 2 ? '#e9e2d2' : null });
    if (t === 2) { lw([.12, .5, 1.6], [.3, .5, 1.24], '#e8f6fb'); lw([.6, .5, 1.66], [.8, .5, 1.26], '#e8f6fb'); lw([.5, .5, .96], [.5, .5, H - .06], c); frameY(.06, .94, .5, .96, H - .06, c); lw([.45, .5, 1.25], [.45, .5, 1.4], '#d9b65c'); lw([.55, .5, 1.25], [.55, .5, 1.4], '#d9b65c'); }
  }
}

const K = (id, tags, o) => Object.assign({ id: 'furn.home.kitchen.' + id, kind: 'furniture', tags: ['home', 'kitchen', ...tags] }, o);
const T3 = [{ tier: 0 }, { tier: 1 }, { tier: 2 }];
export default [
  K('fridge', ['fridge'], { size: [1, .5, 1.7], use: { x: .5, y: .85 }, variants: [{ tier: 0 }, { tier: 1 }, { tier: 1, c: '#9fd0c0' }, { tier: 1, c: FAB.red }, { tier: 2 }, { tier: 2, c: '#c2cad0' }], draw: fridge }),
  K('stove', ['stove'], { size: [1, .5, .82], vb: [-.3, -.3, 0, 1.3, .8, 2.6], use: { x: .5, y: .85 }, variants: [{ tier: 0 }, { tier: 1, on: true }, { tier: 2 }, { tier: 2, on: true, c: '#8a3a3a' }, { tier: 1, hood: false, pot: false }], draw: stove }),
  K('counter', ['counter'], { size: p => [p.len || 1, .5, CH], use: { x: .5, y: .85 }, variants: [{ tier: 0, len: 1 }, { tier: 1, len: 2 }, { tier: 2, len: 3 }, { tier: 1, len: 1, drawers: true, c: '#e9e2d2' }, { tier: 1, len: 2, c: '#5f86a8', top: '#e9e2d2' }], draw: p => { shadow(-.03, (p.len || 1) + .06, 0, .58); counter(0, p.len || 1, p); } }),
  K('counter.corner', ['counter'], { size: [.5, .5, CH], variants: [{ tier: 0 }, { tier: 1, item: 'plant' }, { tier: 2, item: 'jars' }], draw(p) {
    const k = kcol(p); box(0, 0, .08, .5, .5, .66, k.cab); box(0, 0, .74, .54, .54, .06, k.top, { t: k.t === 0 ? k.top : (x, y) => (k.t === 2 ? Math.abs(((x * 1.3 + y * 2.3) % .8) - .4) < .025 : (y % .17) < .03) ? dk(k.top, .16) : k.top });
    const it = p.item || (k.t === 0 ? 'jars' : 'plant');
    if (it === 'plant') { cyl(.24, .24, .8, .09, .12, '#c9764a'); blob(.24, .24, 1.06, 4, 4, '#4f9a55'); blob(.2, .24, 1.12, 2.5, 2.5, '#6dbb68'); }
    else { cyl(.18, .2, .8, .07, .2, '#e9c9a0', { t: '#8a6a4a' }); cyl(.33, .3, .8, .06, .14, '#c8574d', { t: '#8a6a4a' }); }
  } }),
  K('cabinet', ['cabinet'], { size: p => [p.len || 1, .5, .6], wall: true, mount: 1.5, solid: false, variants: [{ tier: 0, len: 1 }, { tier: 1, len: 2 }, { tier: 2, len: 2 }, { tier: 1, len: 1, open: true }], draw(p) {
    const k = kcol(p), n = p.len || 1, d = .34, r = rng(p.seed || 2);
    if (p.open) { shelfUnit(0, 0, 0, n, d, .6, k.cab, 2, (i, z, g, x0, x1, y) => { if (i) stock(x0, x1, y, z, g, r, ['#f1eee6', '#bfe0ea', '#f1eee6', '#e98aa4'], .7); else stock(x0, x1, y, z, g * .8, r, JARC, .8); }, { base: .04 }); return; }
    box(0, 0, 0, n, d, .6, k.cab); for (let i = 0; i < n; i++) { if (i) lw([i, d, 0], [i, d, .6], dk(k.cab, .5)); doorsY(i + .03, i + .97, d, .03, .57, 2, k.cab, k.hd); if (k.t === 2) for (const a of [.1, .56]) { qy(i + a, i + a + .34, d, .14, .5, '#cfe8f0', '#b5d6e2'); frameY(i + a, i + a + .34, d, .14, .5, dk(k.cab, .3)); } }
    glow(() => lw([.05, d, 0], [n - .05, d, 0], '#fff2c4'));
  } }),
  K('sink', ['sink'], { size: [1, .5, CH], vb: [-.3, -.3, 0, 1.3, .8, 1.3], use: { x: .5, y: .85 }, variants: T3, draw: sink }),
  K('island', ['counter', 'island'], { size: [2, 1, .85], vb: [-.3, -.3, 0, 2.3, 1.3, 1.4], use: { x: 1, y: -.35 }, variants: T3, draw: island }),
  onCounter('microwave', ['microwave'], .36, (p, z) => microwave(.15, .08, z, p), [{ tier: 0 }, { tier: 1, on: true }, { tier: 2 }, { tier: 1, base: false }]),
  onCounter('coffee', ['coffee'], .52, (p, z) => { coffee(p.tier === 2 ? .2 : .35, .08, z, p); if (tier(p) < 2) { mug(.76, .3, z, FAB.mustard); } }, [{ tier: 0 }, { tier: 1 }, { tier: 2 }, { tier: 2, base: false }]),
  onCounter('clutter', ['toaster', 'kettle'], .3, (p, z) => { const kd = p.kind || 'both'; if (kd !== 'kettle') toaster(.1, .14, z, p); if (kd !== 'toaster') kettle(kd === 'kettle' ? .38 : .62, .12, z, p); }, [{ tier: 0 }, { tier: 1 }, { tier: 2 }, { tier: 1, kind: 'kettle', base: false }, { tier: 1, kind: 'toaster', base: false }]),
  onCounter('dishrack', ['dishrack'], .3, (p, z) => dishrack(.2, .08, z, p), T3),
  K('trash', ['trash'], { size: [.5, .5, .7], use: { x: .25, y: .8 }, variants: T3, draw: trash }),
  K('pantry', ['pantry', 'storage'], { size: [1, .5, 1.8], use: { x: .5, y: .85 }, variants: T3, draw: pantry }),
];
