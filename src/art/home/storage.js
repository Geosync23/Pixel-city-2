// Bedroom storage, lamps, heating, hallway bits, seasonal decor, pets' furniture.
import { box, qy, qx, qz, lw, fq, glow, lit, cyl, ball, cone, rng, dk, lt, textY, ENV } from '../../engine/raster.js';
import { tier, wood, FAB, METAL, WHITE, b, leg, legs4, pole, shadow, drawersY, doorsY, dot, blob, oblob, mug, frameY, fabric, stock, books, cushion, shelfUnit } from './_lib.js';

const GOLD = '#d9b65c', WARM = '#ffe9a8';
/** lamp shade: cream by day, glowing at night */
export function shade(x, y, z, r, h, c) { cyl(x, y, z, r, h, c, { t: lt(c, .3) }); glow(() => { cyl(x, y, z, r, h, '#ffe6a0', { t: '#fff8e0', l: '#fff0bd', r: '#ffd98a', ol: false }); }); }
function wardrobe(p) {
  const t = tier(p), wd = wood(p), W = p.w || (t === 2 ? 2 : 1.5), H = 2;
  shadow(-.03, W + .06, 0, .58);
  if (t === 0) { // open clothes rail
    const m = p.metal || '#8e979d', r = rng(p.seed || 3);
    pole(.05, .25, 0, 1.6, m); box(0, .05, 0, W, .4, .06, '#c9b089'); 
    box(.1, .1, .06, .4, .3, .26, '#c9a36a', { l: (u, v) => v === 3 ? '#8a6a44' : '#b8925a' }); b(.62, .12, .06, .22, .14, .08, FAB.red); b(.9, .14, .06, .22, .14, .08, '#f8f5ee');
    lw([.05, .25, 1.6], [W - .05, .25, 1.6], lt(m, .3));
    for (let x = .16; x < W - .12; x += .14) { const c = [FAB.red, FAB.blue, FAB.mustard, '#f8f5ee', FAB.teal, FAB.plum, FAB.grey, FAB.rose][r() * 8 | 0], len = .5 + r() * .5; dot(x + .05, .25, 1.62, '#3a3a46'); box(x, .12, 1.52 - len, .11, .26, len, c, { ol: false, t: lt(c, .2) }); lw([x, .38, 1.52 - len], [x, .38, 1.52], dk(c, .45)); }
    pole(W - .05, .25, 0, 1.6, m); return;
  }
  for (const [x, y] of [[.06, .06], [W - .06, .06], [.06, .44], [W - .06, .44]]) leg(x, y, 0, .08, t === 2 ? GOLD : dk(wd, .3));
  box(0, 0, .06, W, .5, H - .06, wd, { t: lt(wd, .1) });
  const n = t === 2 ? 4 : 3, hd = t === 2 ? GOLD : METAL[1], dz = t === 1 ? .46 : .1;
  if (t === 1) { lw([.03, .5, .44], [W - .03, .5, .44], dk(wd, .45)); drawersY(.04, W - .04, .5, .1, .44, 1, wd, hd); lw([W / 2, .5, .1], [W / 2, .5, .44], dk(wd, .45)); }
  doorsY(.04, W - .04, .5, dz, H - .06, n, wd, hd);
  for (let i = 0; i < n; i++) { const x0 = .04 + i * (W - .08) / n, x1 = x0 + (W - .08) / n; if (t === 2 && (i === 1 || i === 2)) { qy(x0 + .06, x1 - .06, .5, .3, H - .2, '#bcd9e4', '#c9e3ec'); lw([x0 + .14, .5, H - .3], [x0 + .3, .5, H - .7], '#eef8fb'); frameY(x0 + .06, x1 - .06, .5, .3, H - .2, GOLD); } else frameY(x0 + .07, x1 - .07, .5, dz + .08, H - .14, dk(wd, .22)); }
  if (t === 1) { box(.2, .1, H, .5, .3, .2, '#c9a36a', { l: (u, v) => v === 2 ? '#8a6a44' : '#b8925a' }); } else lw([0, .5, H], [W, .5, H], GOLD);
}
function dresser(p) {
  const t = tier(p), wd = wood(p), W = p.w || 1, H = .85, hd = t === 2 ? GOLD : t ? METAL[1] : '#3a3a46';
  shadow(-.03, W + .06, 0, .58);
  for (const [x, y] of [[.06, .06], [W - .06, .06], [.06, .44], [W - .06, .44]]) leg(x, y, 0, .1, t === 2 ? GOLD : dk(wd, .3));
  box(0, 0, .08, W, .5, H - .08, wd, { t: lt(wd, .1) });
  const cols = W > 1 ? 2 : 1; for (let k = 0; k < cols; k++) { const x0 = .04 + k * (W - .08) / cols, x1 = x0 + (W - .08) / cols - (cols > 1 && !k ? .02 : 0); drawersY(x0, x1, .5, .12, H - .04, t === 2 ? 4 : 3, wd, hd); if (k) lw([x0, .5, .12], [x0, .5, H - .04], dk(wd, .42)); }
  if (t === 0) { qy(.5, .9, .5, .37, .42, FAB.red); dot(.3, .5, .25, FAB.mustard); }
  // top clutter
  if (t === 0) { b(.12, .14, H, .26, .2, .04, FAB.blue); b(.14, .16, H + .04, .22, .18, .03, FAB.cream); mug(.7, .25, H, '#f8f5ee'); }
  else { box(W / 2 - .2, .04, H, .4, .04, .5, t === 2 ? GOLD : wd); qy(W / 2 - .16, W / 2 + .16, .08, H + .05, H + .46, '#bcd9e4', '#c9e3ec'); lw([W / 2 - .1, .08, H + .4], [W / 2, .08, H + .2], '#eef8fb');
    b(.08, .2, H, .14, .12, .08, FAB.rose, { t: lt(FAB.rose, .3) }); cyl(W - .16, .25, H, .05, .12, '#bfe0ea'); dot(W - .16, .25, H + .16, GOLD);
    if (t === 2) { cyl(.3, .3, H, .05, .1, '#f8f5ee'); blob(.3, .3, H + .22, 2.6, 2.6, '#e98aa4'); blob(.27, .3, H + .27, 1.6, 1.6, '#f7c1d4'); } }
}
function nightstand(p) {
  const t = tier(p), wd = wood(p), H = .5, sc = p.c || ['#e9dcc0', '#f1e6c8', '#f4ecd8'][t];
  shadow(.02, .52, .02, .52);
  if (t === 0) { box(.03, .03, 0, .44, .44, H, '#c98a4a', { l: (u, v) => (v % 3 === 0) ? '#8a5a2a' : '#b5763a', r: (u, v) => (v % 3 === 0) ? '#6f4a26' : '#93602f', t: '#d9a060' }); }
  else { for (const [x, y] of [[.07, .07], [.43, .07], [.07, .43], [.43, .43]]) leg(x, y, 0, .12, t === 2 ? GOLD : dk(wd, .3)); box(.02, .02, .1, .46, .46, H - .1, wd, { t: lt(wd, .1) }); drawersY(.05, .45, .48, .13, H - .03, t === 2 ? 2 : 1, wd, t === 2 ? GOLD : METAL[1]); if (t === 1) { qy(.06, .44, .48, .13, .28, dk(wd, .5)); books(.1, .36, .48, .13, .12, rng(4), 1); } }
  if (p.lamp !== false) {
    if (t === 0) { cyl(.25, .22, H, .07, .03, '#3a3a46', { ol: false }); pole(.25, .22, H, .2, '#3a3a46'); shade(.25, .22, H + .2, .12, .16, sc); }
    else { cyl(.25, .2, H, .07, .14, t === 2 ? GOLD : (p.c2 || FAB.teal), { ol: false }); pole(.25, .2, H + .14, .08, '#8e979d'); shade(.25, .2, H + .22, .15, .2, sc); }
  }
  if (t >= 1) { b(.32, .34, H, .1, .07, .06, '#3a3a46'); lit(() => { dot(.34, .41, H + .03, '#ff7a5a'); dot(.38, .41, H + .03, '#ff7a5a'); }); } else mug(.34, .36, H, FAB.blue);
}
function floorLamp(p) {
  const t = tier(p), m = t === 2 ? GOLD : t ? '#3a3a46' : '#8e979d', sc = p.c || ['#f1eee6', '#f1e6c8', '#f4ecd8'][t];
  shadow(.08, .46, .08, .46);
  cyl(.25, .25, 0, .14, .04, m);
  if (t === 0) { pole(.25, .25, .04, 1.25, m); glow(() => ball(.25, .25, 1.5, .2, '#ffe6a0', { t: '#fff8e0', d: '#ffd98a', ol: false })); ball(.25, .25, 1.5, .19, sc, { squash: .95 }); lw([.25, .43, 1.42], [.25, .43, 1.58], dk(sc, .2)); glow(() => { ball(.25, .25, 1.5, .19, '#ffe6a0', { t: '#fff8e0', d: '#ffd98a', ol: false, squash: .95 }); }); }
  else if (t === 1) { leg(.25, .25, .04, 1.3, m); shade(.25, .25, 1.34, .2, .28, sc); lw([.25, .25, 1.2], [.25, .25, 1.0], dk(m, .0)); dot(.25, .26, 1.2, GOLD, 1, 2); }
  else { leg(.25, .25, .04, 1.5, m); lw([.25, .25, 1.54], [.25, .5, 1.72], m); lw([.25, .5, 1.72], [.25, .8, 1.66], m); lw([.25, .8, 1.66], [.25, .95, 1.5], m); cyl(.25, .95, 1.28, .16, .2, sc, { t: lt(sc, .3) }); glow(() => { cyl(.25, .95, 1.28, .16, .2, '#ffe6a0', { t: '#fff8e0', l: '#fff0bd', r: '#ffd98a', ol: false }); }); }
}
function radiator(p) {
  const t = tier(p), c = p.c || ['#e4dfd0', '#f4f1ea', '#3a3a46'][t], W = p.len || 1, H = t === 2 ? 1.5 : .6, x0 = t === 2 ? .3 : 0, x1 = t === 2 ? .7 : W;
  if (t === 0) { for (let x = x0 + .04; x < x1 - .04; x += .125) box(x, .04, .06, .09, .12, H - .06, c, { ol: false, t: lt(c, .2) }); lw([x0, .16, .06], [x1, .16, .06], dk(c, .5)); lw([x0, .16, H], [x1, .16, H], lt(c, .5)); leg(x0 + .06, .1, 0, .06, dk(c, .3)); leg(x1 - .06, .1, 0, .06, dk(c, .3)); dot(x1, .1, .5, FAB.red, 1, 0); }
  else if (t === 1) { box(x0, .03, .1, x1 - x0, .1, H - .1, c, { l: (u, v) => (u % 4 === 3) ? dk(c, .3) : dk(c, .12) }); pole(x0 + .08, .08, 0, .1, '#c2cad0'); pole(x1 - .08, .08, 0, .1, '#c2cad0'); b(x1 - .02, .05, .14, .06, .06, .08, '#f8f5ee'); }
  else { for (let x = x0; x < x1; x += .1) box(x, .04, .2, .06, .06, H - .2, c, { ol: false, t: lt(c, .3) }); lw([x0, .1, .2], [x1 - .04, .1, .2], GOLD); lw([x0, .1, H], [x1 - .04, .1, H], GOLD); box(x0 - .02, .06, .9, x1 - x0 + .02, .06, .3, '#f8f5ee', { l: (u, v) => v === 2 ? FAB.teal : '#dcd8ce' }); }
}
function fireplace(p) {
  const t = tier(p), c = p.c || ['#a8563e', '#e9e2d2', '#f3f0ea'][t], W = 2, H = 1.25, on = p.on !== false;
  const brick = (cc) => (u, v) => { const row = Math.floor(v / 3); if (v % 3 === 0) return dk(cc, .3); return ((u + (row & 1) * 3) % 6 === 0) ? dk(cc, .3) : cc; };
  const marble = (cc) => (u, v) => Math.abs(((u * 1.1 + v * 2.1) % 17) - 8) < .6 ? dk(cc, .12) : cc;
  qz(.1, W - .1, .5, .82, .01, t === 2 ? '#3a3a46' : '#8e8a84'); lw([.1, .82, 0], [W - .1, .82, 0], '#59607a'); lw([W - .1, .5, 0], [W - .1, .82, 0], '#59607a');
  box(.1, 0, 0, W - .2, .42, H - .1, c, t === 0 ? { l: brick(dk(c, .18)), r: brick(dk(c, .36)) } : t === 2 ? { l: marble(dk(c, .1)), r: dk(c, .3) } : null);
  if (t === 0) box(.3, 0, H - .1, W - .6, .36, 1.2, c, { l: brick(dk(c, .18)), r: brick(dk(c, .36)) }); else { box(.42, 0, H, W - .84, .1, .9, t === 2 ? '#2c2738' : wood(p)); qy(.5, W - .5, .1, H + .08, H + .82, t === 2 ? '#bcd9e4' : '#8fc8ea', t === 2 ? '#c9e3ec' : null); if (t === 1) qy(.5, W - .5, .1, H + .08, H + .4, '#6dbb68'); frameY(.5, W - .5, .1, H + .08, H + .82, t === 2 ? GOLD : dk(wood(p), .3)); }
  // firebox
  qy(.55, W - .55, .42, 0, .72, '#22202a'); frameY(.55, W - .55, .42, 0, .72, t === 2 ? GOLD : dk(c, .5)); if (t !== 0) frameY(.5, W - .5, .42, 0, .77, dk(c, .25));
  lw([.7, .44, .08], [1.3, .44, .08], '#5a3a2a'); lw([.75, .44, .13], [1.25, .44, .13], '#7a4a2a'); lw([.8, .44, .05], [1.2, .44, .05], '#3a241a');
  if (on) glow(() => { qy(.57, W - .57, .42, .02, .7, '#4a1c14'); });
  if (on) lit(() => { const f = (x, h, col) => fq([[x - .12, .44, .12], [x + .12, .44, .12], [x, .44, .12 + h]], col); f(.85, .34, '#ff7a2c'); f(1.12, .42, '#ff7a2c'); f(1.0, .5, '#ff9a3c'); f(.93, .26, '#ffc24a'); f(1.08, .3, '#ffc24a'); f(1.0, .2, '#fff2a8'); dot(.8, .44, .5, '#ffb04a'); dot(1.2, .44, .58, '#ffb04a'); });
  box(0, 0, H - .1, W, .5, .1, t === 0 ? wood(p) : c, { t: lt(t === 0 ? wood(p) : c, .12) });
  // mantel decor
  const z = H; if (t === 0) { mug(.4, .3, z, FAB.blue); b(1.3, .2, z, .3, .06, .22, wood(p)); qy(1.33, 1.57, .26, z + .03, z + .19, '#f7d9c4'); }
  else { for (const x of [.2, W - .2]) { pole(x, .3, z, t === 2 ? .26 : .18, t === 2 ? GOLD : '#f8f5ee'); dot(x, .3, z + (t === 2 ? .3 : .22), '#ffb04a'); glow(() => { dot(x, .3, z + (t === 2 ? .3 : .22), WARM); dot(x, .3, z + (t === 2 ? .3 : .22), '#fff8e0', 0, -1); }); }
    cyl(W / 2, .3, z, .1, .16, t === 2 ? GOLD : '#c9764a'); oblob(W / 2, .3, z + .1, 2.2, 2.2, '#f8f5ee'); dot(W / 2, .3, z + .1, '#2c2738'); dot(W / 2, .3, z + .1, '#2c2738', 0, -1);
    if (ENV.season === 3) { for (let x = .3; x < W - .2; x += .22) { const k = Math.round(x * 5) % 3; box(x, .5, z - .42 + (k ? 0 : .06), .12, .02, .28, [FAB.red, '#f8f5ee', '#3f8a55'][k], { ol: false }); } lw([.1, .5, z - .1], [W - .1, .5, z - .1], '#3f8a55'); } }
}
function xmasTree(p) {
  const t = tier(p), g = p.c || '#2f7a4a', r = rng(p.seed || 12), H = [1.3, 1.9, 2.2][t], R = [.36, .5, .58][t];
  shadow(.1, .95, .1, .95);
  if (t === 2) { cyl(.5, .5, 0, .2, .2, '#c8574d'); lw([.3, .64, .14], [.7, .64, .14], GOLD); } else cyl(.5, .5, 0, .15, .16, t ? '#c9764a' : '#8e979d');
  pole(.5, .5, .1, .3, '#5a3a2a');
  const n = t === 0 ? 3 : 4; for (let i = 0; i < n; i++) { const k = i / n; cone(.5, .5, .26 + k * (H - .3), R * (1 - k * .72), (H - .26) / n * 1.7, i % 2 ? lt(g, .08) : g); }
  const N = [8, 22, 34][t]; for (let i = 0; i < N; i++) { const k = r(), a = r() * 2 - 1, z = .34 + k * (H - .55), w = R * (1 - k * .78) * .82; const x = .5 + a * w * .7, y = .5 - a * w * .7 + w * .25; const c = ['#ffd24a', '#ff5a5a', '#8ad8ff', '#ff8ad0', '#f8f5ee'][i % 5]; if (i % 2) lit(() => dot(x, y, z, c)); else { dot(x, y, z, t === 2 ? GOLD : c); dot(x, y, z, dk(t === 2 ? GOLD : c, .3), 0, 1); } }
  if (t) lit(() => { dot(.5, .5, H + .04, '#ffe9a8'); dot(.5, .5, H + .04, '#ffe9a8', 0, -1); dot(.5, .5, H + .04, '#ffe9a8', 0, -2); dot(.5, .5, H + .04, '#ffd24a', -1, -1); dot(.5, .5, H + .04, '#ffd24a', 1, -1); });
  else { dot(.5, .5, H, '#f2c13a'); dot(.5, .5, H, '#f2c13a', 0, -1); }
  if (t) { box(.12, .72, 0, .26, .22, .18, FAB.red, { t: lt(FAB.red, .15) }); lw([.25, .94, 0], [.25, .94, .18], '#f8f5ee'); lw([.25, .72, .18], [.25, .94, .18], '#f8f5ee'); box(.66, .78, 0, .2, .18, .12, FAB.blue); lw([.76, .96, 0], [.76, .96, .12], GOLD); }
  if (t === 2) { box(.42, .8, 0, .2, .18, .26, '#3f8a55'); lw([.52, .98, 0], [.52, .98, .26], FAB.red); box(.76, .5, 0, .2, .2, .2, GOLD); lw([.86, .7, 0], [.86, .7, .2], '#f8f5ee'); }
}
function pumpkin(p) {
  const t = tier(p), one = (x, y, r, c, carved) => { ball(x, y, r * .8, r, c, { squash: .72 }); lw([x - r * .4, y + r * .6, r * .2], [x - r * .4, y + r * .6, r * 1.3], dk(c, .25)); lw([x + r * .5, y + r * .5, r * .2], [x + r * .5, y + r * .5, r * 1.3], dk(c, .25)); dot(x, y, r * 1.62, '#4f7a3a'); dot(x, y, r * 1.62, '#4f7a3a', 0, -1);
    if (carved) { const cz = r * .8, e = () => { for (const [dx, dy] of [[-2, -1], [2, -1], [-2, 2], [-1, 3], [0, 2], [1, 3], [2, 2]]) dot(x, y, cz, '#ffd24a', dx, dy); }; for (const [dx, dy] of [[-2, -1], [2, -1], [-2, 2], [-1, 3], [0, 2], [1, 3], [2, 2]]) dot(x, y, cz, '#5a2a14', dx, dy); glow(e); } };
  shadow(.06, .46, .06, .46);
  if (t === 2) { one(.16, .14, .14, '#e9dcc0'); one(.34, .28, .2, p.c || '#e8843a', p.carved !== false); one(.1, .4, .1, '#d9562b'); }
  else if (t === 1) one(.26, .24, .23, p.c || '#e8843a', p.carved !== false); else one(.27, .27, .17, p.c || '#e8843a', p.carved);
}
function boxes(p) {
  const r = rng(p.seed || 1), n = p.n || (p.tier != null ? 3 - tier(p) : 3), cb = '#c9a36a', tape = '#e9d9a8';
  const one = (x, y, z, w, d, h, label, open) => { const c = [cb, '#b8925a', '#d2ad74'][r() * 3 | 0]; box(x, y, z, w, d, h, c, { t: open ? '#6f5438' : lt(c, .15) }); if (!open) { lw([x + w / 2, y, z + h], [x + w / 2, y + d, z + h], tape); lw([x + w / 2, y + d, z + h], [x + w / 2, y + d, z + h - .12], tape); } else { fq([[x, y, z + h], [x + w, y, z + h], [x + w + .0, y - .12, z + h + .14], [x, y - .12, z + h + .14]], lt(c, .2)); qx(x + w, y, y + d, z + h, z + h + .01, c); }
    if (label && w * 16 >= label.length * 4 + 1) textY(label, x + (w - (label.length * 4 - 1) / 16) / 2, y + d, z + h * .72, dk(c, .55)); };
  shadow(0, 1.04, 0, 1.04);
  if (n === 1) { one(.2, .25, 0, .6, .5, .45, 'BED', false); return; }
  one(.04, .06, 0, .56, .46, .46, null, false); if (n >= 3) one(.1, .1, .46, .46, .4, .36, null, false);
  one(.42, .5, 0, .54, .46, .42, 'MISC', n < 3 ? false : true);
  if (n >= 3) { cyl(.6, .72, .34, .05, .22, '#f1eee6', { ol: false }); blob(.76, .74, .5, 2.6, 2.6, '#4f9a55'); pole(.84, .66, .3, .34, '#8e979d'); b(.5, .6, .36, .2, .1, .12, FAB.red); }
  if (n >= 2) { box(.04, .6, 0, .32, .32, .26, '#b8925a', { t: '#d2ad74' }); lw([.2, .92, .26], [.2, .92, .14], tape); lw([.2, .6, .26], [.2, .92, .26], tape); }
}
function shoeRack(p) {
  const t = tier(p), wd = wood(p), r = rng(p.seed || 2), cs = [FAB.red, '#f8f5ee', '#3a3a46', FAB.blue, FAB.mustard, '#8a5a3a', FAB.rose, FAB.teal];
  const pair = (x, y, z, boot) => { const c = cs[r() * cs.length | 0]; for (const dx of [0, .1]) { b(x + dx, y, z, .07, .2, boot ? .2 : .06, c, { t: lt(c, .2) }); if (!boot) b(x + dx, y, z + .06, .07, .1, .04, c, { t: '#3a3038' }); } };
  shadow(-.02, 1.05, 0, .56);
  if (t === 0) { qz(.02, .98, .04, .46, .01, (x, y) => (Math.floor(x * 8) & 1) ? '#7a7f8a' : '#8a8f9a'); pair(.08, .12, .01); pair(.38, .18, .01, true); pair(.7, .1, .01); return; }
  if (t === 1) { for (const x of [.03, .97]) { pole(x, .06, 0, .56, dk(wd, .3)); } for (const z of [.08, .32]) { box(.02, .04, z - .03, .96, .42, .03, wd); for (let x = .08; x < .8; x += .3) pair(x, .14, z, z < .2 && x > .6); } for (const x of [.03, .97]) pole(x, .44, 0, .56, wd); box(.02, .04, .53, .96, .42, .03, wd); cyl(.8, .25, .56, .07, .1, '#c9764a'); blob(.8, .25, .78, 3, 3, '#4f9a55'); }
  else { for (const [x, y] of [[.06, .06], [.94, .06], [.06, .44], [.94, .44]]) leg(x, y, 0, .08, GOLD); box(0, 0, .06, 1, .5, .42, wd); doorsY(.03, .97, .5, .09, .45, 2, wd, GOLD); cushion(.02, .02, .48, .96, .46, .07, p.c || FAB.sage); pair(.1, .56, 0); }
}
function doormat(p) {
  const t = tier(p), c = p.c || '#b08a5a', c2 = p.c2 || '#5a3a2a';
  qz(.06, .94, .06, .44, .012, (x, y) => { const dx = Math.abs(x - .5), dy = Math.abs(y - .25); if (dx > .38 || dy > .14) return t ? c2 : c; if (t === 2) { const hx = dx * 2.2, hy = (y - .25) * 2.6 + .06; if (hx * hx + (hy - Math.sqrt(hx) * .5) * (hy - Math.sqrt(hx) * .5) < .09) return p.c3 || FAB.red; } if (t === 1 && (Math.floor((x + y) * 8) & 1)) return lt(c, .15); return (Math.floor(x * 16) + Math.floor(y * 16)) & 1 ? c : dk(c, .08); });
  lw([.06, .44, 0], [.94, .44, 0], dk(c2, .4)); lw([.94, .06, 0], [.94, .44, 0], dk(c2, .4));
}
function sitCat(x, y, z, c) { oblob(x, y, z + .1, 2.6, 3, c); oblob(x, y, z + .28, 2.2, 1.8, c); dot(x, y, z + .28, c, -2, -3); dot(x, y, z + .28, c, 2, -3); dot(x, y, z + .28, dk(c, .65), -1, 0); dot(x, y, z + .28, dk(c, .65), 1, 0); dot(x, y, z + .04, c, 3, 0); dot(x, y, z + .04, c, 4, -1); dot(x, y, z + .04, c, 4, -2); blob(x, y, z + .14, 1, 1.4, lt(c, .5)); }
function catTree(p) {
  const t = tier(p), c = p.c || ['#b9b3a8', '#d9c8a8', '#8fae7e'][t], rope = (h) => ({ l: (u, v) => v % 2 ? '#d9b98a' : '#b8925a', r: (u, v) => v % 2 ? '#b8925a' : '#93744c', ol: false });
  const post = (x, y, z, h) => { for (let k = 0; k * .0625 < h - .01; k++) cyl(x, y, z + k * .0625, .07, .0625, k % 2 ? '#d9b98a' : '#b8925a', { ol: false, t: '#e6cba0' }); };
  shadow(.02, 1, .02, 1);
  box(.05, .05, 0, .9, .9, .08, c, { t: lt(c, .12) });
  if (t === 0) { post(.5, .5, .08, .7); cyl(.5, .5, .78, .26, .07, c, { t: lt(c, .15) }); lw([.7, .6, .78], [.7, .6, .5], '#8e979d'); oblob(.7, .6, .46, 1.4, 1.4, FAB.red); if (p.cat) sitCat(.5, .5, .85, p.catc || '#f2a03a'); return; }
  post(.25, .25, .08, 1.5); post(.75, .3, .08, .7);
  box(.1, .52, .08, .42, .38, .4, c, { t: lt(c, .12) }); blob(.31, .9, .26, 3, 3.4, '#3a3038');
  box(.45, .1, .78, .5, .46, .07, c, { t: lt(c, .15) });
  if (t === 2) { post(.78, .7, .08, 1.1); box(.5, .5, 1.18, .46, .42, .07, c, { t: lt(c, .15) }); post(.25, .25, 1.5, .3); }
  cyl(.25, .25, t === 2 ? 1.8 : 1.58, .25, .08, c, { t: lt(c, .15) }); blob(.25, .25, (t === 2 ? 1.88 : 1.66) + .005, 4.5, 2.2, lt(c, .35));
  lw([.48, .3, 1.58 + (t === 2 ? .22 : 0)], [.48, .3, 1.25], '#8e979d'); oblob(.48, .3, 1.2, 1.4, 1.4, FAB.red);
  if (p.cat) sitCat(.25, .25, (t === 2 ? 1.88 : 1.66), p.catc || '#f2a03a'); if (p.cat2) sitCat(.7, .32, .85, p.cat2c || '#4a4a58');
}

const S = (id, room, tags, o) => Object.assign({ id: 'furn.home.' + id, kind: 'furniture', tags: ['home', room, ...tags] }, o);
const T3 = [{ tier: 0 }, { tier: 1 }, { tier: 2 }];
export default [
  S('wardrobe', 'bedroom', ['wardrobe', 'storage'], { size: p => [p.w || (tier(p) === 2 ? 2 : 1.5), .5, 2], use: { x: .75, y: .85 }, variants: [{ tier: 0 }, { tier: 1 }, { tier: 2 }, { tier: 1, wood: '#e9e2d2' }, { tier: 1, w: 1, wood: '#5f86a8' }], draw: wardrobe }),
  S('dresser', 'bedroom', ['dresser', 'storage'], { size: p => [p.w || 1, .5, .85], vb: p => [-.3, -.3, 0, (p.w || 1) + .3, .8, 1.6], use: { x: .5, y: .85 }, variants: [{ tier: 0 }, { tier: 1 }, { tier: 2, w: 1.5 }, { tier: 1, w: 1.5, wood: '#e9e2d2' }], draw: dresser }),
  S('nightstand', 'bedroom', ['nightstand', 'lamp'], { size: [.5, .5, .5], vb: [-.3, -.3, 0, .8, .8, 1.2], light: { x: .25, y: .6, z: 0, r: 2 }, use: { x: .25, y: .8 }, variants: [{ tier: 0 }, { tier: 1 }, { tier: 2 }, { tier: 1, wood: '#e9e2d2', c2: FAB.rose }, { tier: 1, lamp: false }], draw: nightstand }),
  S('lamp.floor', 'decor', ['lamp', 'living'], { size: [.5, .5, 1.7], vb: [-.3, -.3, 0, .8, 1.3, 2], light: { x: .25, y: .5, z: 0, r: 3 }, use: { x: .25, y: .8 }, variants: T3, draw: floorLamp }),
  S('radiator', 'decor', ['radiator'], { size: p => [p.len || 1, .2, tier(p) === 2 ? 1.5 : .6], wall: true, mount: 0, variants: [{ tier: 0 }, { tier: 1 }, { tier: 2 }, { tier: 1, len: 2 }], draw: radiator }),
  S('fireplace', 'living', ['fireplace', 'decor'], { size: [2, .5, 1.25], vb: [-.3, -.3, 0, 2.3, 1, 2.5], light: { x: 1, y: 1.1, z: 0, r: 3.5 }, use: { x: 1, y: 1.1 }, variants: [{ tier: 0 }, { tier: 1 }, { tier: 2 }, { tier: 1, on: false, c: '#7fa08c' }], draw: fireplace }),
  S('xmastree', 'decor', ['seasonal', 'xmas', 'winter'], { size: [1, 1, 2.2], vb: [-.3, -.3, 0, 1.3, 1.3, 2.6], light: { x: .5, y: .8, z: 0, r: 2.5 }, variants: T3, draw: xmasTree }),
  S('pumpkin', 'decor', ['seasonal', 'halloween', 'autumn'], { size: [.5, .5, .4], solid: false, variants: [{ tier: 0 }, { tier: 1 }, { tier: 2 }, { tier: 1, carved: false, c: '#e9dcc0' }], draw: pumpkin }),
  S('boxes', 'decor', ['boxes', 'moving', 'moving_box'], { size: [1, 1, .9], use: { x: .5, y: 1.3 }, variants: [{ tier: 0, seed: 1 }, { tier: 1, seed: 4 }, { tier: 2, seed: 2 }, { n: 3, seed: 7 }], draw: boxes }),
  S('parcel', 'decor', ['boxes', 'delivery', 'delivery_box'], { size: [.5, .5, .4], use: { x: .25, y: .8 }, variants: [{ tier: 0 }, { tier: 1 }, { tier: 2 }, { tier: 1, c: '#f1eee6' }], draw(p) {
    const t = tier(p), c = p.c || ['#c9a36a', '#b8925a', '#3f6f8a'][t], w = [.34, .42, .44][t], h = [.22, .3, .34][t], x = (.5 - w) / 2;
    shadow(x, x + w + .05, .08, .5); box(x, .08, 0, w, .36, h, c, { t: lt(c, .15) });
    if (t === 2) { lw([x + w / 2, .44, 0], [x + w / 2, .44, h], GOLD); lw([x + w / 2, .08, h], [x + w / 2, .44, h], GOLD); lw([x, .26, h], [x + w, .26, h], GOLD); dot(x + w / 2, .26, h + .04, GOLD, -1, 0); dot(x + w / 2, .26, h + .04, GOLD, 1, 0); dot(x + w / 2, .26, h + .02, GOLD); }
    else { lw([x + w / 2, .08, h], [x + w / 2, .44, h], '#e9d9a8'); lw([x + w / 2, .44, h], [x + w / 2, .44, h - .1], '#e9d9a8'); qy(x + .04, x + .18, .44, h * .3, h * .7, '#f8f5ee'); lw([x + .06, .44, h * .5], [x + .16, .44, h * .5], '#59607a'); if (t) { qy(x + w - .14, x + w - .04, .44, h * .5, h * .8, FAB.red); } }
    if (t === 1) { box(x + .04, .12, h, .2, .16, .1, '#d2ad74', { t: '#e0bd84' }); }
  } }),
  S('shoerack', 'decor', ['shoerack', 'hall', 'storage'], { size: [1, .5, .6], vb: [-.3, -.3, 0, 1.3, 1, 1.1], use: { x: .5, y: .85 }, variants: T3, draw: shoeRack }),
  S('doormat', 'decor', ['doormat', 'hall', 'rug'], { size: [1, .5, .02], vb: [-.1, -.1, 0, 1.1, .6, .1], solid: false, variants: [{ tier: 0 }, { tier: 1 }, { tier: 2 }, { tier: 1, c: '#7a8a6a', c2: '#3f5a3a' }], draw: doormat }),
  S('cattree', 'decor', ['pet', 'cattree'], { size: [1, 1, 1.9], vb: [-.3, -.3, 0, 1.3, 1.3, 2.4], variants: [{ tier: 0, cat: true }, { tier: 1, cat: true, catc: '#8d8f9c' }, { tier: 2, cat: true, cat2: true }, { tier: 1 }], draw: catTree }),
];
