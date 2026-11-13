// Hobby & fitness: easel, instruments, yoga mat, treadmill, dumbbells, aquarium, pet bed.
import { box, qy, qx, qz, lw, fq, glow, lit, cyl, ball, rng, hash2, dk, lt } from '../../engine/raster.js';
import { tier, wood, FAB, METAL, b, leg, legs4, pole, shadow, drawersY, doorsY, dot, blob, oblob, mug, screenY, frameY, painting, fabric, cushion } from './_lib.js';

const GOLD = '#d9b65c';
function easel(p) {
  const t = tier(p), wd = wood(p), kind = p.art || ['blank', 'land', 'portrait'][t];
  shadow(.1, .95, 0, .55);
  lw([.5, .04, 0], [.5, .2, 1.62], dk(wd, .35));
  const cw = [.5, .6, .76][t], ch = [.6, .7, .9][t], x0 = .5 - cw / 2, z0 = .68;
  for (const x of [.16, .84]) { lw([x, .44, 0], [.5 + (x - .5) * .15, .22, 1.66], wd); lw([x + 1 / 16, .44, 0], [.5 + (x - .5) * .15 + 1 / 16, .22, 1.66], dk(wd, .25)); }
  box(.14, .3, z0 - .06, .72, .1, .05, wd);
  box(x0, .3, z0, cw, .04, ch, '#e9e2d2');
  if (kind === 'blank') { qy(x0 + .03, x0 + cw - .03, .34, z0 + .03, z0 + ch - .03, '#f8f5ee'); lw([x0 + .1, .34, z0 + .2], [x0 + .3, .34, z0 + .4], '#b9c2c9'); lw([x0 + .3, .34, z0 + .4], [x0 + .4, .34, z0 + .25], '#b9c2c9'); }
  else qy(x0 + .03, x0 + cw - .03, .34, z0 + .03, z0 + ch - .03, painting(kind, p.seed || 2));
  if (p.wip) qy(x0 + cw * .55, x0 + cw - .03, .34, z0 + .03, z0 + ch * .5, '#f8f5ee');
  // brushes + palette on the tray
  for (const [dx, c] of [[.2, FAB.red], [.26, FAB.blue], [.32, FAB.mustard]]) { lw([dx, .38, z0 - .01], [dx, .38, z0 + .1], '#d9c8a8'); dot(dx, .38, z0 + .12, c); }
  if (t) { oblob(.72, .38, z0 + .03, 2.4, 1.4, '#c9a36a'); dot(.7, .38, z0 + .03, FAB.red); dot(.74, .38, z0 + .04, FAB.blue); dot(.72, .38, z0 + .02, '#f8f5ee', 1, 0); }
}
function guitar(p) {
  const t = tier(p), el = p.electric || t === 2, c = p.c || (el ? FAB.red : t ? '#d9903a' : '#c9a36a'), y = .28;
  shadow(.08, .46, .08, .46);
  lw([.25, .1, 0], [.25, .2, .75], '#3a3a46'); lw([.08, .4, 0], [.25, .2, .3], '#3a3a46'); lw([.42, .4, 0], [.25, .2, .3], '#3a3a46');
  if (el) { oblob(.25, y, .3, 3.4, 3.6, c); oblob(.25, y, .5, 2.4, 2.2, c); blob(.25, y, .4, 2.4, 2.6, c); dot(.25, y, .32, '#f8f5ee'); dot(.25, y, .32, '#f8f5ee', 0, -2); dot(.25, y, .24, GOLD, 2, 1); dot(.25, y, .3, '#f8f5ee', -2, 1); }
  else { oblob(.25, y, .28, 4.2, 4.2, c); oblob(.25, y, .52, 3, 2.8, c); blob(.25, y, .4, 3, 3, c); blob(.25, y, .28, 3, 3, lt(c, .25)); blob(.25, y, .4, 1.3, 1.3, '#3a241a'); dot(.25, y, .2, '#3a241a', -1, 0); dot(.25, y, .2, '#3a241a'); dot(.25, y, .2, '#3a241a', 1, 0); if (t === 0) dot(.25, y, .24, FAB.teal, 3, 0); }
  leg(.25 + .5 / 16, y, .56, .46, el ? '#e9c9a0' : '#6b4630'); b(.21, y - .02, 1.02, .08, .04, .13, el ? c : '#5a3a2a'); dot(.21, y + .02, 1.1, '#e6ebef', -1, 0); dot(.29, y + .02, 1.06, '#e6ebef', 1, 0);
  lw([.18, .34, .16], [.33, .34, .16], '#3a3a46');
}
function piano(p) {
  const t = tier(p), c = p.c || ['#7a5236', '#8a4a2e', '#262430'][t], W = 1.5;
  shadow(-.03, W + .06, 0, .7);
  box(0, 0, 0, W, .4, 1.2, c, { t: lt(c, .08) });
  qy(.08, W - .08, .4, .78, 1.12, dk(c, .1)); frameY(.08, W - .08, .4, .78, 1.12, dk(c, .45)); qy(.1, W - .1, .4, .08, .52, dk(c, .1)); frameY(.1, W - .1, .4, .08, .52, dk(c, .45));
  if (t === 2) { lw([.08, .4, 1.16], [W - .08, .4, 1.16], GOLD); }
  qy(.5, 1, .41, .86, 1.08, '#f8f5ee'); for (let i = 0; i < 3; i++) lw([.54, .41, .92 + i * .05], [.96, .41, .92 + i * .05], '#8d95a8'); lw([.75, .41, .86], [.75, .41, 1.08], '#b9c2c9');
  for (const x of [.66, .75, .84]) dot(x, .4, .04, GOLD);
  leg(.07, .58, 0, .6, c); leg(W - .07, .58, 0, .6, c);
  box(.02, .38, .6, W - .04, .26, .08, c, { t: (x, y) => { if (y < .43) return dk(c, .2); const k = Math.floor(x * 16); if (y < .54 && k % 7 !== 0 && k % 7 !== 3 && (k & 1)) return '#262430'; return (t === 0 && k === 9) ? '#e3d6a8' : '#f8f5ee'; }, l: '#e6e1d4' });
  lw([.02, .64, .6], [W - .02, .64, .6], dk(c, .5));
  if (t === 1) { cyl(.25, .2, 1.2, .08, .12, '#f1eee6'); blob(.25, .2, 1.5, 4, 3.4, '#4f9a55'); blob(.21, .2, 1.56, 2.4, 2.2, '#6dbb68'); b(1.1, .12, 1.2, .16, .04, .2, GOLD); qy(1.12, 1.24, .16, 1.23, 1.37, '#f7d9c4'); }
  if (t === 0) { b(1.0, .1, 1.2, .3, .22, .03, '#f1e6c8'); mug(.3, .2, 1.2, FAB.blue); oblob(.7, .2, 1.21, 2.5, 1.2, dk(c, .15)); }
  if (t === 2) { for (const x of [.22, 1.28]) { pole(x, .2, 1.2, .2, GOLD); for (const dx of [-.06, .06]) { pole(x + dx, .2, 1.32, .12, '#f8f5ee'); dot(x + dx, .2, 1.46, '#ffb04a'); glow(() => { dot(x + dx, .2, 1.46, '#ffe9a8'); dot(x + dx, .2, 1.46, '#fff8e0', 0, -1); }); } lw([x - .06, .2, 1.32], [x + .06, .2, 1.32], GOLD); } }
}
function keyboard(p) {
  const t = tier(p), c = p.c || ['#e8563a', '#2c2738', '#3a3038'][t], W = t === 0 ? 1 : 1.5, x0 = (1.5 - W) / 2, H = .72;
  shadow(x0, x0 + W + .06, 0, .56);
  if (t === 2) { box(x0 + .02, .08, 0, .08, .34, H, wood(p)); box(x0 + W - .1, .08, 0, .08, .34, H, wood(p)); lw([x0 + .1, .42, .3], [x0 + W - .1, .42, .3], dk(wood(p), .2)); }
  else for (const y of [.12, .4]) { lw([x0 + .15, y, 0], [x0 + W - .15, y, H], '#3a3a46'); lw([x0 + W - .15, y, 0], [x0 + .15, y, H], '#59607a'); }
  box(x0, .08, H, W, .34, .08, c, { t: (x, y) => { if (y < .24) return (y > .12 && y < .2 && x > x0 + W * .3 && x < x0 + W * .55) ? '#22252f' : c; const k = Math.floor(x * 16); if (y < .33 && k % 7 !== 0 && k % 7 !== 3 && (k & 1)) return '#262430'; return '#f8f5ee'; }, l: dk(c, .2) });
  lit(() => { dot(x0 + W * .36, .16, H + .085, '#8dffb0'); dot(x0 + W * .44, .16, H + .085, '#ffb04a'); });
  for (let i = 0; i < 3; i++) dot(x0 + W * .7 + i * .08, .16, H + .09, t ? '#c2cad0' : '#ffd24a');
  if (t === 2) { pole(x0 + W / 2, .1, H + .08, .2, '#3a3a46'); qy(x0 + W / 2 - .2, x0 + W / 2 + .2, .12, H + .26, H + .5, '#f8f5ee'); for (let i = 0; i < 3; i++) lw([x0 + W / 2 - .16, .12, H + .32 + i * .06], [x0 + W / 2 + .16, .12, H + .32 + i * .06], '#8d95a8'); }
}
function yogaMat(p) {
  const t = tier(p), c = p.c || FAB.plum, c2 = lt(c, .3);
  qz(.16, .84, .1, 1.9, .012, (x, y) => (x < .2 || x > .8 || y < .14 || y > 1.86) ? c2 : (t && Math.abs(((x + y) * 4) % 1 - .5) < .07) ? lt(c, .12) : c);
  lw([.16, 1.9, .012], [.84, 1.9, .012], dk(c, .45)); lw([.84, .1, .012], [.84, 1.9, .012], dk(c, .45)); lw([.16, 1.9, 0], [.84, 1.9, 0], dk(c, .6)); lw([.84, .1, 0], [.84, 1.9, 0], dk(c, .6));
  if (t >= 1) { cyl(.08, .3, 0, .05, .22, '#8ad8ff', { t: '#f8f5ee' }); box(.86, .2, 0, .12, .22, .1, t === 2 ? '#c9a36a' : FAB.teal); }
  if (t === 2) { box(.86, .5, 0, .12, .22, .1, '#c9a36a'); cyl(.92, 1.6, 0, .05, .08, '#f8f5ee', { ol: false }); dot(.92, 1.6, .12, '#ffb04a'); glow(() => dot(.92, 1.6, .12, '#ffe9a8')); cushion(.3, .16, .012, .4, .16, .08, lt(c, .45)); }
}
function treadmill(p) {
  const t = tier(p), c = p.c || ['#59607a', '#3a3a46', '#262430'][t], ac = p.c2 || [FAB.red, '#5ad0ff', GOLD][t];
  shadow(.08, .98, 0, 2.06);
  box(.12, .04, 0, .76, .36, t ? .26 : .16, c, { t: lt(c, .1) });
  box(.12, .4, 0, .76, 1.56, .16, c, { t: (x, y) => (x < .2 || x > .8) ? lt(c, .12) : (Math.floor(y * 8) & 1 && Math.abs(x - .5) < .03) ? '#c2cad0' : '#2a2a34' });
  lw([.12, 1.96, .1], [.88, 1.96, .1], ac);
  leg(.15, .2, .16, t ? 1.0 : .9, lt(c, .2));
  if (t) { box(.1, .1, 1.1, .8, .14, .24, c); screenY(.2, .8, .24, 1.15, 1.3, p.on, t === 2 ? 'sunset' : 'code', 3); lit(() => { dot(.15, .24, 1.2, '#ff5a5a'); dot(.85, .24, 1.2, '#8dffb0'); }); }
  else { lw([.15, .2, 1.06], [.85, .2, 1.06], lt(c, .3)); b(.4, .16, 1.0, .2, .08, .12, '#22252f'); lit(() => dot(.5, .24, 1.06, '#ff7a3c')); }
  lw([.15, .24, t ? 1.1 : 1.06], [.15, .62, 1], '#8e979d'); lw([.15, .62, 1], [.15, .5, .16], '#59607a'); lw([.85, .24, t ? 1.1 : 1.06], [.85, .62, 1], '#8e979d'); lw([.85, .62, 1], [.85, .5, .16], '#59607a');
  leg(.85, .2, .16, t ? 1.0 : .9, lt(c, .2)); if (t === 2) cyl(.94, .3, 1.0, .04, .16, '#8ad8ff', { ol: false });
}
function dumbbell(x, y, z, c) { b(x + .02, y + .05, z + .02, .05, .2, .05, '#8e979d'); b(x, y, z, .09, .08, .09, c); b(x, y + .22, z, .09, .08, .09, c); }
function dumbbells(p) {
  const t = tier(p), cs = [FAB.teal, FAB.mustard, FAB.red, FAB.blue, FAB.plum, '#3a3a46'], m = t === 2 ? '#c2cad0' : '#3a3a46';
  shadow(-.02, 1.05, 0, .56);
  if (t === 0) { qz(0, 1, 0, .5, .01, (x, y) => ((Math.floor(x * 2) + Math.floor(y * 2)) & 1) ? '#4a4a58' : '#54546a'); dumbbell(.1, .08, .01, cs[2]); dumbbell(.26, .14, .01, cs[2]); ball(.62, .25, .13, .11, '#3a3a46'); lw([.56, .25, .26], [.68, .25, .26], '#3a3a46'); lw([.56, .25, .2], [.56, .25, .26], '#3a3a46'); lw([.68, .25, .2], [.68, .25, .26], '#3a3a46'); cyl(.86, .14, 0, .05, .22, '#8ad8ff', { t: '#f8f5ee' }); return; }
  const lv = t === 2 ? [.14, .44, .74] : [.2, .56];
  for (const x of [.04, .96]) { lw([x, .06, 0], [x, .14, lv[lv.length - 1] + .12], m); }
  lv.forEach((z, i) => { box(.03, .06 + i * 0, z - .04, .94, .4 - i * .06, .04, m); const n = 6 - i; for (let k = 0; k < n; k++) dumbbell(.08 + k * (.84 / n) + i * .02, .09, z, i === 2 ? '#3a3a46' : cs[(k + i * 2) % 5]); });
  for (const x of [.04, .96]) lw([x, .44, 0], [x, .2, lv[lv.length - 1] + .12], lt(m, .2));
  if (t === 2) { ball(.2, .25, .08, .08, FAB.red, { ol: false }); ball(.42, .25, .08, .08, FAB.mustard, { ol: false }); }
}
function aquarium(p) {
  const t = tier(p), wd = wood(p), W = p.len || 1, r = rng(p.seed || 4);
  shadow(-.03, W + .06, 0, .58);
  if (t === 0) { // fishbowl on a little table
    legs4(.2, .05, 0, .6, .4, .55, wd, .05); box(.18, .03, .55, .64, .44, .06, wd);
    lit(() => { ball(.5, .25, .82, .21, '#7fc8e0', { t: '#b8e6f2', d: '#58a8c8' }); dot(.5, .25, .82, '#ff8a3c', 1, 1); dot(.5, .25, .82, '#ff8a3c', 2, 1); dot(.5, .25, .82, '#ffb04a', 3, 0); dot(.5, .25, .7, '#4f9a55', -3, 0); dot(.5, .25, .74, '#4f9a55', -3, 0); dot(.5, .25, .68, '#d9c8a8', 0, 1); dot(.5, .25, .68, '#d9c8a8', 2, 1); });
    blob(.5, .25, 1.02, 3.4, 1.4, '#b8e6f2'); b(.74, .3, .61, .08, .08, .1, '#f2c13a'); return;
  }
  const H = .62; b(.03, .03, 0, W - .06, .42, .06, dk(wd, .5)); box(0, 0, .05, W, .5, H - .05, wd); doorsY(.03, W - .03, .5, .08, H - .03, Math.round(W * 2), wd, t === 2 ? GOLD : METAL[1]);
  const fish = []; for (let i = 0; i < 4 + W * 3; i++) fish.push([2 + r() * (W * 16 - 5) | 0, 3 + r() * 5 | 0, ['#ff8a3c', '#ffd24a', '#ff5a8a', '#f4f8fb', '#5a8aff'][r() * 5 | 0]]);
  const weeds = []; for (let i = 0; i < W * 4; i++) weeds.push([1 + r() * (W * 16 - 2) | 0, 2 + r() * 5 | 0]);
  const water = (dkn) => (u, v, w, h) => { if (v < 2) return (u + v) & 1 ? '#e9d9b0' : '#d9c090'; for (const f of fish) { if (v === f[1] && (u === f[0] || u === f[0] + 1)) return f[2]; if (v === f[1] && u === f[0] + 2 && t === 2) return f[2]; } for (const q of weeds) if (u === q[0] && v < 2 + q[1]) return (v & 1) ? '#3f9a55' : '#58b868'; if (t === 2 && v < 5 && (u % 9) < 3 && v < 3 + (u % 9)) return '#ff7a8a'; if (hash2(u, v, 5) > .975) return '#dff6fb'; return v > h - 3 ? '#8fdcf0' : dkn ? '#3f9cc0' : '#58b4d4'; };
  lit(() => box(.03, .03, H, W - .06, .44, .5, '#58b4d4', { l: water(false), r: (u, v, w, h) => v < 2 ? '#c9b080' : '#3f9cc0', t: '#a8e6f4', ol: false }));
  frameY(.03, W - .03, .47, H, H + .5, '#3a3a46'); lw([W - .03, .03, H], [W - .03, .03, H + .5], '#3a3a46'); lw([W - .03, .03, H], [W - .03, .47, H], '#3a3a46');
  box(.01, .01, H + .5, W - .02, .48, .07, t === 2 ? '#262430' : '#3a3a46'); if (t === 2) lw([.01, .49, H + .52], [W - .01, .49, H + .52], GOLD);
  b(W - .2, .2, H + .57, .1, .1, .06, '#f2c13a');
}
function curled(x, y, z, kind, c) {
  c = c || (kind === 'dog' ? '#c9a36a' : '#f2a03a');
  oblob(x, y, z + .06, 4.2, 2.4, c); blob(x - .02, y, z + .1, 2.6, 1.3, lt(c, .2));
  dot(x, y, z + .06, c, 4, -2); dot(x, y, z + .06, c, 5, -1); dot(x, y, z + .06, dk(c, .65), 4, -3); dot(x, y, z + .06, dk(c, .65), 6, -2);
  if (kind === 'dog') { dot(x, y, z + .06, dk(c, .4), 5, 0); dot(x, y, z + .06, dk(c, .4), 6, 0); } else { dot(x, y, z + .06, c, 3, -3); dot(x, y, z + .06, c, 6, -2); dot(x, y, z + .06, dk(c, .65), 3, -4); }
  dot(x, y, z + .06, dk(c, .3), -3, 1); dot(x, y, z + .06, dk(c, .3), -2, 2); dot(x, y, z + .06, dk(c, .3), -1, 2);
}
function petBed(p) {
  const t = tier(p), c = p.c || [FAB.blue, FAB.red, FAB.plum][t];
  shadow(.04, .98, .02, .5);
  if (t === 0) { box(.08, .06, 0, .56, .4, .2, '#c9a36a', { t: '#7a5a3a', l: (u, v) => (u === 4 && v > 4) ? '#a8824e' : '#b8925a' }); qz(.1, .62, .08, .44, .12, fabric(c, lt(c, .3), 'check', .1)); lw([.08, .46, .2], [.64, .46, .2], '#d9b98a'); if (p.pet) curled(.36, .26, .1, p.pet, p.petc); }
  else { cyl(.36, .26, 0, .28, t === 2 ? .14 : .1, c, { t: dk(c, .12) }); blob(.36, .26, (t === 2 ? .14 : .1) - .01, 8, 4, lt(c, t === 2 ? .5 : .3)); if (p.pet) curled(.36, .26, .06, p.pet, p.petc); if (t === 2) { dot(.36, .5, .12, GOLD); dot(.36, .5, .12, GOLD, -1, 0); dot(.36, .5, .12, GOLD, 1, 0); } }
  cyl(.84, .3, 0, .07, .05, t === 2 ? GOLD : '#c2cad0', { t: '#8a5a3a' }); if (t) { b(.76, .08, 0, .12, .05, .03, '#f8f5ee'); dot(.76, .1, .04, '#f8f5ee', -1, 0); dot(.88, .1, .04, '#f8f5ee', 1, 0); }
}

const A = (id, tags, o) => Object.assign({ id: 'furn.home.' + id, kind: 'furniture', tags: ['home', 'living', ...tags] }, o);
const T3 = [{ tier: 0 }, { tier: 1 }, { tier: 2 }];
export default [
  A('easel', ['easel', 'art'], { size: [1, .5, 1.7], use: { x: .5, y: .9 }, variants: [{ tier: 0 }, { tier: 1 }, { tier: 2 }, { tier: 1, art: 'sea', wip: true }, { tier: 2, art: 'abstract', seed: 5 }, { tier: 1, art: 'cat' }], draw: easel }),
  A('guitar', ['instrument', 'music'], { size: [.5, .5, 1.15], use: { x: .25, y: .8 }, variants: [{ tier: 0 }, { tier: 1 }, { tier: 2 }, { tier: 2, c: '#3fb8a8' }, { tier: 1, c: '#8a4a2e' }], draw: guitar }),
  A('piano', ['instrument', 'music'], { size: [1.5, .5, 1.2], vb: [-.3, -.3, 0, 1.8, .9, 1.8], use: { x: .75, y: 1 }, variants: T3, draw: piano }),
  A('keyboard', ['instrument', 'music'], { size: [1.5, .5, .8], vb: [-.3, -.3, 0, 1.8, .8, 1.4], use: { x: .75, y: .85 }, variants: T3, draw: keyboard }),
  A('yogamat', ['exercise', 'yoga'], { size: [1, 2, .05], vb: [-.1, -.1, 0, 1.1, 2.1, .4], solid: false, use: { x: .5, y: 1 }, seats: [{ x: .5, y: 1, z: .02, dir: 1, stand: true }], variants: [{ tier: 0, c: FAB.teal }, { tier: 1 }, { tier: 2, c: FAB.sage }, { tier: 1, c: FAB.rose }], draw: yogaMat }),
  A('treadmill', ['exercise', 'gym'], { size: [1, 2, 1.35], use: { x: .5, y: 2.3 }, seats: [{ x: .5, y: 1.15, z: .17, dir: 3, stand: true }], variants: [{ tier: 0 }, { tier: 1, on: true }, { tier: 2, on: true }], draw: treadmill }),
  A('dumbbells', ['exercise', 'gym'], { size: [1, .5, .9], use: { x: .5, y: .85 }, variants: T3, draw: dumbbells }),
  A('aquarium', ['aquarium', 'pet'], { size: p => [p.len || 1, .5, 1.2], use: { x: .5, y: .85 }, light: { x: .5, y: .7, z: 0, r: 1.5 }, variants: [{ tier: 0 }, { tier: 1 }, { tier: 2, len: 2 }, { tier: 1, len: 1.5, seed: 9, wood: '#e9e2d2' }], draw: aquarium }),
  A('petbed', ['pet', 'petbed'], { size: [1, .5, .25], vb: [-.2, -.2, 0, 1.2, .7, .6], solid: false, use: { x: .5, y: .8 }, variants: [{ tier: 0, pet: 'cat' }, { tier: 1 }, { tier: 1, pet: 'dog' }, { tier: 2, pet: 'cat', petc: '#8d8f9c' }, { tier: 2, c: FAB.teal, pet: 'dog', petc: '#f1eee6' }], draw: petBed }),
];
