// Tables & desks. Tables list `chairs`: suggested chair spots [{x,y,face}] = chair footprint CENTRE and the chair's p.face (1 faces +y, 3 faces -y).
// Desks stand against the back wall; the user sits on the +y side (`use` = centre of the office chair, chair p.face = 3).
import { box, qy, qx, qz, lw, glow, lit, cyl, rng, dk, lt } from '../../engine/raster.js';
import { tier, wood, FAB, METAL, WHITE, b, leg, legs4, pole, shadow, drawersY, doorsY, dot, blob, oblob, mug, fabric, screenY, frameY, books } from './_lib.js';

const GOLD = '#d9b65c';
const topC = (p, t) => p.top || (t === 0 ? '#c9c4b8' : t === 1 ? wood(p) : (p.marble ? '#f3f0ea' : wood(p)));
const grain = (c, t) => t === 0 ? c : (x, y) => (y % .25) < .03 ? dk(c, .14) : c;
function plate(x, y, z, food) { oblob(x, y, z, 2.6, 1.3, '#f8f5ee'); if (food) blob(x, y, z, 1.2, .6, food); }
function centre(x, y, z, p, t) {
  if (p.centre === false) return;
  if (t === 0) { b(x - .16, y - .12, z, .3, .26, .04, '#e9e2d2', { t: '#f1eee6' }); dot(x, y, z + .05, '#c8574d'); mug(x + .28, y + .05, z, FAB.blue); }
  else if (t === 1) { cyl(x, y, z, .055, .14, p.c2 || '#7fb6d0'); blob(x, y, z + .3, 2.6, 2.6, '#4f9a55'); for (const [dx, dz, c] of [[-.06, .34, '#f2a7c3'], [.05, .38, '#ffd24a'], [0, .29, '#f7c1d4'], [.08, .3, '#e8563a']]) dot(x + dx, y, z + dz, c); }
  else { for (const dx of [-.12, 0, .12]) { pole(x + dx, y, z, dx ? .14 : .2, '#f8f5ee'); dot(x + dx, y, z, GOLD); glow(() => { dot(x + dx, y, z + (dx ? .16 : .22), '#ffe9a8'); dot(x + dx, y, z + (dx ? .16 : .22), '#fff8e0', 0, -1); }); dot(x + dx, y, z + (dx ? .16 : .22), '#ffb04a'); } }
}
function table(w, d, p, spots) {
  const t = tier(p), wd = wood(p), tc = topC(p, t), lc = t === 0 ? METAL[0] : t === 2 ? (p.marble ? GOLD : wd) : wd, H = .75;
  shadow(0, w + .08, 0, d + .08);
  if (t === 0) { for (const x of [.1, w - .1]) { lw([x, .08, 0], [x, d - .08, H - .08], dk(lc, .2)); lw([x, d - .08, 0], [x, .08, H - .08], lc); } }
  else legs4(0, 0, 0, w, d, H - .1, lc, .08);
  if (t) box(.06, .06, H - .15, w - .12, d - .12, .08, dk(wd, .12), { ol: false });
  box(0, 0, H - .07, w, d, .07, tc, { t: p.marble && t === 2 ? ((x, y) => Math.abs(((x * 1.3 + y * 2.3) % .8) - .4) < .025 ? dk(tc, .16) : tc) : grain(tc, t) });
  if (t === 2 || p.runner) { const rc = p.c || FAB.red; if (w > d) qz(.08, w - .08, d / 2 - .13, d / 2 + .13, H + .005, fabric(rc, lt(rc, .3), 'xstripe', .12)); else qz(w / 2 - .13, w / 2 + .13, .08, d - .08, H + .005, rc); }
  centre(w / 2, d / 2, H, p, t);
  if (p.set) spots.forEach(([x, y], i) => { plate(x, y, H + .01, t === 0 ? null : ['#d9a45a', '#8fbf4a', '#e8563a', '#f2c13a'][i % 4]); if (t) dot(x + .18, y, H + .03, '#bfe0ea', 0, -1); });
}
function roundTable(p) {
  const t = tier(p), wd = wood(p), tc = topC(p, t), H = .75, c = .75;
  shadow(.1, 1.5, .1, 1.5);
  if (t === 0) { for (const [dx, dy] of [[-.45, -.45], [.45, -.45], [-.45, .45], [.45, .45]]) leg(c + dx, c + dy, 0, H - .07, wd); }
  else { cyl(c, c, 0, .32, .04, t === 2 ? GOLD : dk(wd, .2)); cyl(c, c, .04, .08, H - .12, t === 2 ? GOLD : wd, { ol: false }); }
  cyl(c, c, H - .07, .72, .07, tc, { t: tc });
  if (t === 2 || p.cloth) { cyl(c, c, H - .2, .73, .2, p.c || '#f1eee6', { t: p.c || '#f8f5ee' }); }
  centre(c, c, H, p, t);
  if (p.set) [[.75, .3], [.3, .75], [1.2, .75], [.75, 1.2]].forEach(([x, y], i) => plate(x, y, H + .01, t ? ['#d9a45a', '#8fbf4a', '#e8563a', '#f2c13a'][i] : null));
}
function coffeeTable(p) {
  const t = tier(p), wd = wood(p), r = rng(p.seed || 4);
  if (p.round) {
    shadow(.1, 1, .1, 1);
    if (t === 2) { cyl(.5, .5, 0, .3, .03, GOLD); cyl(.5, .5, .03, .06, .3, GOLD, { ol: false }); cyl(.5, .5, .33, .46, .05, p.top || '#f3f0ea'); }
    else { for (const [x, y] of [[.25, .25], [.75, .25], [.25, .75], [.75, .75]]) leg(x, y, 0, .32, dk(wd, .2)); cyl(.5, .5, .32, .46, .06, p.top || wd); }
    oblob(.42, .5, .4, 3, 1.5, FAB.teal); mug(.66, .6, .385, '#f8f5ee'); if (t) { b(.4, .28, .385, .2, .14, .03, FAB.rose); }
    return;
  }
  shadow(0, 1.58, 0, .58);
  if (t === 0) { // crates
    for (const x of [0, .76]) box(x, 0, 0, .74, .5, .36, '#b89668', { l: (u, v) => v % 4 === 0 ? '#8a6a44' : (u === 5) ? '#8a6a44' : '#b08a5a', r: (u, v) => v % 4 === 0 ? '#6f5438' : '#93744c' });
    b(.2, .1, .36, .4, .34, .04, '#e9e2d2', { t: '#f1eee6' }); dot(.4, .28, .41, FAB.red); mug(1.1, .3, .36, FAB.mustard); b(1.25, .12, .36, .16, .07, .02, '#3a3a46');
  } else if (t === 1) {
    legs4(0, 0, 0, 1.5, .5, .34, dk(wd, .15), .07); b(.08, .06, .12, 1.34, .38, .03, dk(wd, .1)); books(.2, .6, .44, .15, .08, r, 1);
    box(0, 0, .34, 1.5, .5, .06, wd, { t: grain(wd, 1) });
    b(.18, .14, .4, .3, .22, .025, FAB.teal, { t: '#4aa39d' }); b(.22, .16, .425, .26, .2, .02, FAB.cream); mug(.75, .3, .4, '#f8f5ee'); b(.95, .2, .4, .16, .07, .02, '#3a3a46'); cyl(1.3, .25, .4, .06, .08, '#c9764a'); blob(1.3, .25, .58, 3, 3, '#4f9a55'); blob(1.27, .25, .64, 2, 2, '#6dbb68');
  } else {
    for (const [x, y] of [[.05, .05], [1.45, .05], [.05, .45], [1.45, .45]]) leg(x, y, 0, .36, GOLD);
    lw([.05, .45, .1], [1.45, .45, .1], GOLD); lw([1.45, .05, .1], [1.45, .45, .1], dk(GOLD, .2));
    box(0, 0, .36, 1.5, .5, .04, p.top || '#cfe8f0', { t: p.top || '#d8eef4', l: '#a8cbd6' }); lw([.2, .1, .405], [.5, .4, .405], '#f4fbfd');
    b(.9, .12, .4, .32, .24, .03, '#3a3038'); b(.93, .14, .43, .28, .2, .03, FAB.rose); cyl(.5, .25, .4, .1, .05, GOLD, { t: '#8a6a4a' }); oblob(.5, .25, .49, 1.5, 1.5, '#e8563a');
    pole(1.33, .3, .4, .1, '#f8f5ee'); glow(() => dot(1.33, .3, .52, '#ffe9a8')); dot(1.33, .3, .52, '#ffb04a');
  }
}
function monitor(x, y, z, w, h, p, c) { b(x + w / 2 - .1, y - .02, z, .2, .12, .02, dk(c, .2)); pole(x + w / 2, y + .02, z, .1, dk(c, .2)); box(x, y, z + .08, w, .05, h, c); screenY(x + .03, x + w - .03, y + .05, z + .11, z + .05 + h, p.on, p.show || 'desktop', p.seed); }
function laptop(x, y, z, p, c) { b(x, y - .04, z, .32, .04, .22, c); screenY(x + .02, x + .3, y, z + .03, z + .2, p.on, p.show || 'code', p.seed); box(x, y, z, .32, .2, .02, c, { t: (a, q) => (q - y > .03 && q - y < .13 && a - x > .03 && a - x < .29) ? dk(c, .35) : c }); }
function deskLamp(x, y, z, c) { cyl(x, y, z, .06, .02, dk(c, .3), { ol: false }); lw([x, y, z], [x - .08, y, z + .22], dk(c, .3)); lw([x - .08, y, z + .22], [x + .06, y + .06, z + .36], dk(c, .3)); b(x + .02, y + .02, z + .3, .12, .12, .08, c); glow(() => { b(x + .03, y + .03, z + .29, .1, .1, .03, '#ffe9a8'); dot(x + .1, y + .1, z + .27, '#fff8e0'); }); }
function desk(p) {
  const t = tier(p), wd = p.wood || ['#c9b089', '#9c6a3e', '#f1eee6'][t], H = .75, mc = t === 0 ? '#d9d2bd' : t === 1 ? '#3a3a46' : '#22252f';
  shadow(0, 1.58, 0, .58);
  if (t === 0) { for (const x of [.15, 1.35]) { lw([x - .1, .25, 0], [x, .25, H - .06], '#8a6a44'); lw([x + .1, .25, 0], [x, .25, H - .06], '#8a6a44'); lw([x - .07, .25, .3], [x + .07, .25, .3], '#8a6a44'); } }
  else if (t === 1) { leg(.07, .07, 0, H - .06, wd); leg(.07, .43, 0, H - .06, wd); box(1, .03, 0, .46, .44, H - .06, wd); drawersY(1.03, 1.43, .47, .04, H - .08, 3, wd, METAL[1]); }
  else { for (const [x, y] of [[.06, .06], [1.44, .06], [.06, .44], [1.44, .44]]) leg(x, y, 0, H - .06, GOLD); box(.5, .05, H - .2, .5, .4, .14, wd); lw([.65, .45, H - .13], [.85, .45, H - .13], GOLD); }
  if (t !== 1) { const tc = t ? '#2c2738' : '#d9d2bd'; box(1.12, .1, 0, .22, .36, .46, tc); if (t === 2) lit(() => { lw([1.15, .46, .06], [1.15, .46, .4], '#ff5ad0'); lw([1.19, .46, .06], [1.19, .46, .4], '#5ad0ff'); }); else { dot(1.2, .46, .38, '#3a3a46'); lit(() => dot(1.28, .46, .38, '#8dffb0')); } }
  box(0, 0, H - .06, 1.5, .5, .06, t === 2 ? wd : wd, { t: t === 2 ? wd : grain(wd, 1) });
  if (t === 0) { box(.42, .04, H, .5, .34, .42, mc); if (p.on) lit(() => qy(.47, .87, .38, H + .08, H + .37, (u, v, w, h) => (v & 1) || u < 1 ? '#1b3a2a' : (u < 2 + ((v * 7) % (w - 3))) ? '#8dffb0' : '#1b3a2a')); else qy(.47, .87, .38, H + .08, H + .37, '#3a4a44'); frameY(.47, .87, .38, H + .08, H + .37, dk(mc, .4)); }
  else if (t === 1) monitor(.4, .1, H, .62, .4, p, mc);
  else { monitor(.22, .1, H, .9, .42, p, mc); b(.06, .1, H, .1, .1, .22, '#3a3a46'); b(1.2, .1, H, .1, .1, .22, '#3a3a46'); }
  // keyboard, mouse, mug, lamp
  b(.48, .32, H, .4, .12, .02, t ? '#e6ebef' : '#d9d2bd', { t: (x, y) => (Math.floor(x * 16) & 1) ? (t ? '#f8f5ee' : '#ece6d6') : (t ? '#b9c2c9' : '#b3ad9f') }); b(.96, .36, H, .06, .08, .02, t ? '#f8f5ee' : '#d9d2bd');
  if (t === 2) lit(() => lw([.48, .44, H + .01], [.88, .44, H + .01], '#5ad0ff'));
  mug(.2, .38, H, p.c || FAB.red);
  if (t) deskLamp(t === 2 ? 1.36 : 1.3, .16, H, p.c || FAB.mustard); else { b(1.05, .2, H, .28, .22, .03, '#f1eee6'); b(1.07, .22, H + .03, .24, .2, .02, '#bfe0ea'); }
}
function laptopTable(p) {
  const t = tier(p), wd = wood(p), H = .75;
  shadow(0, 1.06, 0, .56);
  if (t === 0) { for (const x of [.1, .9]) { lw([x, .06, 0], [x, .44, H - .05], METAL[0]); lw([x, .44, 0], [x, .06, H - .05], dk(METAL[0], .2)); } box(0, 0, H - .05, 1, .5, .05, '#c9c4b8'); }
  else { legs4(0, 0, 0, 1, .5, H - .07, t === 2 ? GOLD : wd, .07); if (t === 1) b(.06, .06, H - .15, .88, .38, .08, dk(wd, .12)); box(0, 0, H - .07, 1, .5, .07, t === 2 ? (p.top || '#f3f0ea') : wd, { t: t === 2 ? (p.top || '#f3f0ea') : grain(wd, 1) }); }
  laptop(.3, .16, H, p, t === 0 ? '#59607a' : t === 1 ? '#c2cad0' : '#e6ebef');
  mug(.76, .3, H, p.c || FAB.teal); b(.06, .2, H, .16, .2, .02, '#f1e6c8'); if (t) { b(.08, .22, H + .02, .14, .18, .02, FAB.rose); }
  if (t === 2) { cyl(.86, .12, H, .05, .07, '#f8f5ee'); blob(.86, .12, H + .2, 2.5, 3, '#4f9a55'); }
}

const TB = (id, tags, o) => Object.assign({ id: 'furn.home.' + id, kind: 'furniture', tags: ['home', ...tags] }, o);
export default [
  TB('table.2', ['kitchen', 'dining', 'table'], { size: [1, 1, .75], vb: [-.3, -.3, 0, 1.3, 1.3, 1.3], use: { x: .5, y: 1.35 }, chairs: [{ x: .5, y: -.3, face: 1 }, { x: .5, y: 1.3, face: 3 }],
    variants: [{ tier: 0, set: true }, { tier: 1 }, { tier: 1, set: true, wood: '#e9e2d2', runner: true, c: FAB.teal }, { tier: 2, set: true }, { tier: 2, marble: true }], draw: p => table(1, 1, p, [[.5, .2], [.5, .8]]) }),
  TB('table.4', ['kitchen', 'dining', 'table'], { size: [2, 1, .75], vb: [-.3, -.3, 0, 2.3, 1.3, 1.3], use: { x: 1, y: 1.35 }, chairs: [{ x: .5, y: -.3, face: 1 }, { x: 1.5, y: -.3, face: 1 }, { x: .5, y: 1.3, face: 3 }, { x: 1.5, y: 1.3, face: 3 }],
    variants: [{ tier: 0 }, { tier: 1, set: true }, { tier: 2, set: true, c: FAB.navy }, { tier: 2, marble: true, c: FAB.sage }], draw: p => table(2, 1, p, [[.5, .2], [1.5, .2], [.5, .8], [1.5, .8]]) }),
  TB('table.round', ['kitchen', 'dining', 'table'], { size: [1.5, 1.5, .75], vb: [-.3, -.3, 0, 1.8, 1.8, 1.3], use: { x: .75, y: 1.85 }, chairs: [{ x: .75, y: -.3, face: 1 }, { x: .75, y: 1.8, face: 3 }, { x: -.3, y: .75, face: 1, flip: true }, { x: 1.8, y: .75, face: 3, flip: true }],
    variants: [{ tier: 0 }, { tier: 1, set: true }, { tier: 1, cloth: true, c: '#e98a8a', set: true }, { tier: 2, set: true }], draw: roundTable }),
  TB('coffeetable', ['living', 'table', 'coffeetable'], { size: p => p.round ? [1, 1, .4] : [1.5, .5, .4], vb: p => p.round ? [-.3, -.3, 0, 1.3, 1.3, .9] : [-.3, -.3, 0, 1.8, .8, .9], use: { x: .75, y: .85 },
    variants: [{ tier: 0 }, { tier: 1 }, { tier: 2 }, { tier: 1, round: true }, { tier: 2, round: true }], draw: coffeeTable }),
  TB('desk', ['living', 'bedroom', 'computer', 'desk'], { size: [1.5, .5, .8], vb: [-.3, -.3, 0, 1.8, .8, 1.5], use: { x: .68, y: .85 }, light: { x: 1.3, y: .5, z: 0, r: 1.5 },
    variants: [{ tier: 0, on: true }, { tier: 1, on: true }, { tier: 2, on: true, show: 'code' }, { tier: 1, wood: '#e9e2d2', c: FAB.teal }, { tier: 2, on: true, show: 'game', wood: '#3a3038' }], draw: desk }),
  TB('laptop', ['living', 'bedroom', 'computer', 'table'], { size: [1, .5, .78], vb: [-.3, -.3, 0, 1.3, .8, 1.2], use: { x: .46, y: .85 }, variants: [{ tier: 0, on: true }, { tier: 1, on: true, show: 'desktop' }, { tier: 2, on: true }, { tier: 1 }], draw: laptopTable }),
];
