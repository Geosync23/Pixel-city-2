// Wall-mounted items for the back walls. Convention: wall:true, size [w, 0.1, h] (shelves/radiators a little deeper), the item stands at
// local y=0 facing +y with local z=0 at its BOTTOM edge; `mount` = recommended height of that bottom edge above the floor (doors: 0).
import { box, qy, qx, qz, lw, glow, lit, rng, dk, lt } from '../../engine/raster.js';
import { tier, wood, FAB, METAL, b, pole, dot, blob, oblob, mug, frameY, painting, books, stock } from './_lib.js';

const GOLD = '#d9b65c', GLASS = ['#bcd9e4', '#c9e3ec'];
const glint = (x, z, y = .07) => { lw([x, y, z], [x + .16, y, z - .3], '#eef8fb'); lw([x + .08, y, z], [x + .16, y, z - .16], '#eef8fb'); };
function art(p) {
  const t = tier(p), w = p.w || 1, h = p.h || .8, fr = p.frame || ['#3a3a46', wood(p), GOLD][t], kind = p.art || ['abstract', 'land', 'portrait'][t];
  box(0, 0, 0, w, .06, h, fr); let i = t === 2 ? .09 : .05;
  if (t === 1) { qy(i, w - i, .06, i, h - i, '#f4f1ea'); i += .07; }
  qy(i, w - i, .06, i, h - i, painting(kind, p.seed || 1)); if (t === 2) { frameY(i, w - i, .06, i, h - i, dk(GOLD, .35)); dot(0, .06, h, lt(GOLD, .5), 1, 1); }
}
function poster(p) {
  const t = tier(p), w = p.w || .75, h = p.h || 1, kind = p.art || ['band', 'film', 'map'][t];
  if (t === 2) { box(0, 0, 0, w, .05, h, '#2c2738'); qy(.05, w - .05, .05, .05, h - .05, painting(kind, p.seed || 1)); return; }
  qy(.02, w - .02, .03, .03, h - .03, painting(kind, p.seed || 1)); lw([w - .02, .03, .03], [w - .02, .03, h - .03], '#2c273840');
  if (t === 1) { box(0, 0, h - .06, w, .05, .06, wood(p)); box(0, 0, 0, w, .05, .05, wood(p)); lw([w * .3, .03, h], [w / 2, .03, h + .1], '#3a3a46'); lw([w * .7, .03, h], [w / 2, .03, h + .1], '#3a3a46'); }
  else { for (const [x, z] of [[.04, .05], [w - .06, .05], [.04, h - .05], [w - .06, h - .05]]) dot(x, .03, z, '#f1e6c8'); dot(w - .04, .03, .05, '#d9d2bd', 0, -1); }
}
function photos(p) {
  const t = tier(p), r = rng(p.seed || 3), fr = [['#3a3a46', '#f1eee6'], [wood(p), '#f1eee6', '#3a3a46'], [GOLD, '#2c2738']][t];
  const L = [[0, .45, .4, .5], [.48, .55, .5, .4], [.5, .05, .34, .42], [.06, 0, .36, .36], [1.06, .3, .42, .56], [.92, 0, .3, .24]];
  L.forEach(([x, z, w, h], i) => { const f = fr[i % fr.length]; box(x, 0, z, w, .04, h, f); qy(x + .05, x + w - .05, .04, z + .05, z + h - .05, painting(['portrait', 'land', 'sea', 'cat', 'portrait', 'mountain'][(i + (r() * 3 | 0)) % 6], i + (p.seed || 1))); });
}
function mirror(p) {
  const t = tier(p), tall = p.tall, w = tall ? .5 : 1, h = tall ? 1.5 : 1, fr = p.frame || ['#e6e1d4', wood(p), GOLD][t];
  if (p.round || (t === 2 && !tall)) {
    if (t === 2) for (let a = 0; a < 16; a++) { const an = a / 16 * Math.PI * 2; lw([.5 + Math.cos(an) * .28, .04, .5 + Math.sin(an) * .3], [.5 + Math.cos(an) * (a % 2 ? .42 : .5), .04, .5 + Math.sin(an) * (a % 2 ? .44 : .52)], GOLD); }
    oblob(.5, .05, .5, 6.5, 7.5, fr); blob(.5, .05, .5, 5, 6, GLASS[0]); blob(.47, .05, .56, 3, 4, GLASS[1]); dot(.42, .05, .62, '#eef8fb'); dot(.42, .05, .62, '#eef8fb', 1, 1); return;
  }
  box(0, 0, 0, w, .05, h, fr); const i = t === 2 ? .07 : .05; qy(i, w - i, .05, i, h - i, GLASS[0], GLASS[1]); glint(w * .25, h - .14, .05); if (t === 2) frameY(i, w - i, .05, i, h - i, dk(GOLD, .3));
}
function clock(p) {
  const t = tier(p), rim = p.c || [FAB.red, wood(p), GOLD][t];
  if (t === 2) { box(.14, 0, -.5, .22, .08, .5, wood(p)); lw([.25, .08, -.1], [.25, .08, -.36], GOLD); oblob(.25, .08, -.38, 1.4, 1.4, GOLD); }
  oblob(.25, .05, .25, 4.2, 4.6, rim); blob(.25, .05, .25, 3.2, 3.6, '#f8f5ee');
  for (const [dx, dy] of [[0, -3], [0, 3], [-3, 0], [3, 0]]) dot(.25, .05, .25, t === 2 ? GOLD : '#8d95a8', dx, dy);
  dot(.25, .05, .25, '#2c2738'); dot(.25, .05, .25, '#2c2738', 0, -1); dot(.25, .05, .25, '#2c2738', 0, -2); dot(.25, .05, .25, '#2c2738', 1, 0); dot(.25, .05, .25, FAB.red, 1, 1);
}
function shelf(p) {
  const t = tier(p), wd = wood(p), W = p.len || 1, r = rng(p.seed || 5);
  const one = (z, k) => { if (t) { lw([.1, .02, z - .12], [.1, .2, z], t === 2 ? GOLD : '#3a3a46'); lw([W - .1, .02, z - .12], [W - .1, .2, z], t === 2 ? GOLD : '#3a3a46'); }
    box(0, 0, z, W, .26, .05, wd); const z1 = z + .05;
    if (k) { books(.06, W * .5, .2, z1, .24, r, 1); mug(W * .62, .14, z1, FAB.teal); b(W - .3, .06, z1, .2, .03, .2, t === 2 ? GOLD : '#3a3a46'); qy(W - .27, W - .13, .09, z1 + .03, z1 + .17, '#f7d9c4'); }
    else { box(.06, .06, z1, .12, .12, .1, '#c9764a', { ol: false }); blob(.12, .12, z1 + .2, 3, 2.6, '#4f9a55'); for (let i = 0; i < 4; i++) dot(.14 + (i % 2) * .06, .2, z1 - .02 - i * .06, '#58b868'); books(W * .32, W * .72, .2, z1, .22, r, .95); oblob(W - .14, .14, z1 + .08, 2, 2, t === 2 ? GOLD : FAB.mustard); } };
  if (t === 2) one(.5, 1); one(.12, t === 2 ? 0 : (p.seed || 0) % 2);
}
function win(p) {
  const t = tier(p), w = p.w || 1.5, h = p.h || 1.2, fr = p.frame || '#f4f1ea', night = p.night, sky = p.sky || (night ? '#1d2748' : '#9fd3ee'), c = p.c || [FAB.cream, FAB.teal, FAB.plum][t];
  box(-.05, 0, -.06, w + .1, .16, .06, fr); box(0, 0, 0, w, .08, h, fr);
  const g0 = .07, g1 = w - .07; qy(g0, g1, .08, .07, h - .07, sky);
  if (night) { lit(() => { for (const [a, k] of [[.2, .8], [.5, .6], [.72, .85], [.35, .4], [.85, .5]]) dot(g0 + (g1 - g0) * a, .08, h * k, '#f4f8fb'); blob(g0 + (g1 - g0) * .62, .08, h * .72, 1.6, 1.6, '#fff8e0'); }); for (let x = g0; x < g1 - .2; x += .26) qy(x, x + .18, .08, .07, .16 + ((x * 7) % 3) * .08, '#141a33'); }
  else { blob(g0 + (g1 - g0) * .3, .08, h * .72, 3, 1.4, '#f4fbfd'); blob(g0 + (g1 - g0) * .42, .08, h * .68, 2, 1, '#f4fbfd'); blob(g0 + (g1 - g0) * .75, .08, h * .5, 2.4, 1.1, '#e3f4fa'); qy(g0, g1, .08, .07, .07 + h * .14, p.ground || '#8fc88a'); }
  lw([w / 2, .08, .07], [w / 2, .08, h - .07], fr); if (t) lw([g0, .08, h * .55], [g1, .08, h * .55], fr); frameY(g0, g1, .08, .07, h - .07, dk(fr, .3));
  if (p.curtain === false) return;
  if (t === 0) { qy(g0, g1, .1, h * .62, h - .04, c, null); for (let z = h * .66; z < h - .05; z += .08) lw([g0, .1, z], [g1, .1, z], dk(c, .14)); lw([g0, .1, h * .62], [g1, .1, h * .62], dk(c, .4)); lw([g1 - .1, .1, h * .62], [g1 - .1, .1, h * .4], '#8e979d'); }
  else {
    const cw = w * (t === 2 ? .3 : .24), z0 = t === 2 ? -.5 : -.12, fold = (cc) => (u, v) => (u % 4 === 0) ? dk(cc, .32) : (u % 4 === 2) ? lt(cc, .12) : dk(cc, .1);
    if (t === 2) qy(g0, g1, .1, .07, h - .05, '#f8f5ee', 'glass');
    qy(-.1, cw, .12, z0, h + .08, fold(c)); qy(w - cw, w + .1, .12, z0, h + .08, fold(c));
    if (t === 1) { lw([-.1, .12, h * .34], [cw, .12, h * .34], p.c2 || GOLD); lw([w - cw, .12, h * .34], [w + .1, .12, h * .34], p.c2 || GOLD); }
    if (t === 2) box(-.14, 0, h + .04, w + .28, .16, .16, c, { l: dk(c, .05) }); else { lw([-.16, .12, h + .1], [w + .16, .12, h + .1], '#5a3a2a'); dot(-.16, .12, h + .1, GOLD); dot(w + .16, .12, h + .1, GOLD); }
  }
}
function leafY(x0, x1, y, z1, c, t, hd) {
  qy(x0, x1, y, 0, z1, c); const m = (x0 + x1) / 2, pn = dk(c, .22);
  if (t === 0) { dot(m, y, z1 * .82, '#8e979d'); }
  else { for (const [a, bb, z, zz] of [[x0 + .08, m - .04, z1 * .52, z1 - .1], [m + .04, x1 - .08, z1 * .52, z1 - .1], [x0 + .08, m - .04, .1, z1 * .46], [m + .04, x1 - .08, .1, z1 * .46]]) frameY(a, bb, y, z, zz, pn); }
  lw([x1 - .12, y, z1 * .5], [x1 - .12, y, z1 * .5 + .08], hd); dot(x1 - .12, y, z1 * .5, hd, -1, 0); frameY(x0, x1, y, 0, z1, dk(c, .45));
}
function doorFront(p) {
  const t = tier(p), c = p.c || ['#8a6a4a', '#3f6f5a', '#8a3a3a'][t], fr = p.frame || '#f1eee6', hd = t === 2 ? GOLD : t ? '#d9b65c' : '#8e979d';
  box(0, 0, 0, 1, .08, 1.75, fr); leafY(.07, .93, .08, 1.66, c, t, hd);
  if (t === 0) { lw([.75, .08, 1.0], [.9, .08, 1.02], '#8e979d'); qy(.3, .5, .08, .2, .26, dk(c, .2)); }
  if (t >= 1) { qy(.36, .64, .08, .78, .84, hd); lw([.4, .08, .81], [.6, .08, .81], dk(hd, .4)); dot(.5, .08, 1.5, hd); dot(.5, .08, 1.5, hd, 0, 1); }
  if (t === 2) { for (const x of [.16, .56]) { qy(x, x + .28, .08, 1.14, 1.5, '#cfe8f0', '#b5d6e2'); glow(() => qy(x, x + .28, .08, 1.14, 1.5, '#ffe9a8')); frameY(x, x + .28, .08, 1.14, 1.5, GOLD); } }
  qz(.07, .93, .08, .14, .005, dk(fr, .25));
}
function doorRoom(p) {
  const t = tier(p), c = p.c || ['#d9d2bd', '#f4f1ea', '#5e3f30'][t], fr = p.frame || (t === 2 ? '#5e3f30' : '#f1eee6'), hd = t === 2 ? GOLD : '#8e979d';
  box(0, 0, 0, 1, .08, 1.75, fr);
  if (p.open) { qy(.07, .93, .08, 0, 1.66, p.beyond || '#3a3448'); qy(.07, .93, .08, 0, .2, p.floor || '#5a5266'); box(.89, .08, 0, .05, .8, 1.64, c); lw([.94, .8, .8], [.94, .8, .88], hd); }
  else leafY(.07, .93, .08, 1.66, c, t, hd);
}
function doorway(p) {
  const t = tier(p), fr = p.frame || ['#e6e1d4', '#f1eee6', '#5e3f30'][t], W = p.w || 1, H = 1.85;
  box(0, 0, 0, W, .08, H, fr); qy(.09, W - .09, .08, 0, H - .1, p.beyond || '#3a3448'); qy(.09, W - .09, .08, 0, .22, p.floor || '#5a5266');
  if (t === 2 || p.arch) { for (const [x, s] of [[.09, 1], [W - .09, -1]]) { qy(Math.min(x, x + s * .16), Math.max(x, x + s * .16), .08, H - .2, H - .1, fr); qy(Math.min(x, x + s * .07), Math.max(x, x + s * .07), .08, H - .3, H - .2, fr); } }
  if (p.bead) for (let x = .14; x < W - .1; x += .08) { for (let z = H - .14; z > .5 + ((x * 13) % 3) * .12; z -= .1) dot(x, .1, z, [FAB.mustard, FAB.teal, FAB.rose][Math.round(z * 10 + x * 12) % 3]); }
}
function coatHooks(p) {
  const t = tier(p), wd = wood(p), z = .78;
  if (t === 2) { box(0, 0, z + .14, 1, .24, .04, wd); cyl2(.2, .12, z + .18); } 
  box(0, 0, z, 1, .05, .1, wd); for (const x of [.14, .38, .62, .86]) { dot(x, .07, z + .04, t === 2 ? GOLD : '#3a3a46'); dot(x, .09, z + .02, t === 2 ? GOLD : '#3a3a46'); }
  const coat = (x, len, c) => { box(x - .11, .05, z - len, .22, .1, len, c, { l: (u, v, w, h) => (u === 1) ? dk(c, .4) : dk(c, .16) }); lw([x, .15, z - len + .05], [x, .15, z - .1], dk(c, .45)); };
  coat(.14, .7, p.c || FAB.mustard); if (t) { box(.33, .05, z - .5, .1, .06, .5, FAB.red, { l: (u, v) => v % 4 < 2 ? '#f1eee6' : dk(FAB.red, .1), ol: true }); coat(.62, .6, p.c2 || FAB.navy); }
  box(.8, .05, z - .34, .14, .1, .22, '#8a5a3a'); lw([.82, .1, z - .12], [.86, .1, z + .02], '#5a3a2a'); lw([.92, .1, z - .12], [.86, .1, z + .02], '#5a3a2a');
}
function cyl2(x, y, z) { b(x - .1, y - .06, z, .22, .14, .08, FAB.char, { t: lt(FAB.char, .2) }); b(x + .3, y - .08, z, .3, .18, .12, '#c9a36a'); }
function fairy(p) {
  const W = p.len || 2, cs = p.warm ? ['#ffe9a8'] : ['#ffd24a', '#ff7a7a', '#8ad8ff', '#8dffb0', '#ff8ad0'], n = Math.round(W / .5);
  const sag = x => { const f = (x / (W / n)) % 1; return .3 - .22 * (1 - (2 * f - 1) * (2 * f - 1)); };
  for (let x = 0; x < W; x += 1 / 16) lw([x, .04, sag(x)], [x + 1 / 16, .04, sag(x + 1 / 16)], '#3a4a3a');
  let i = 0; for (let x = .08; x < W; x += .17, i++) { const c = cs[i % cs.length], z = sag(x) - .05; dot(x, .05, z, dk(c, .15)); dot(x, .05, z, c, 0, -1); glow(() => { dot(x, .05, z, c); dot(x, .05, z, '#fff8e0', 0, -1); dot(x, .05, z, c, -1, 0); dot(x, .05, z, c, 1, 0); dot(x, .05, z, c, 0, 1); }); }
}

const W = (id, tags, o) => Object.assign({ id: 'furn.home.wall.' + id, kind: 'furniture', tags: ['home', 'decor', 'wall', ...tags], wall: true, solid: false }, o);
const T3 = [{ tier: 0 }, { tier: 1 }, { tier: 2 }];
export default [
  W('art', ['art', 'painting'], { size: p => [p.w || 1, .1, p.h || .8], mount: 1.2, variants: [{ tier: 0, seed: 2 }, { tier: 1, seed: 3 }, { tier: 2, seed: 1 }, { tier: 1, art: 'sea', w: 1.5, h: 1 }, { tier: 2, art: 'still', w: .75, h: 1 }, { tier: 1, art: 'mountain', w: 1.5, h: .8, wood: '#e9e2d2' }, { tier: 0, art: 'night', w: .75, h: .75 }, { tier: 1, art: 'cat', w: .75, h: .75 }] , draw: art }),
  W('poster', ['poster', 'art'], { size: p => [p.w || .75, .1, p.h || 1], mount: 1.1, variants: [{ tier: 0 }, { tier: 1 }, { tier: 2 }, { tier: 0, art: 'cat' }, { tier: 0, art: 'night', seed: 4 }, { tier: 2, art: 'band' }], draw: poster }),
  W('photos', ['photos', 'art'], { size: [1.5, .1, 1], mount: 1.1, variants: [{ tier: 0, seed: 1 }, { tier: 1, seed: 4 }, { tier: 2, seed: 7 }], draw: photos }),
  W('mirror', ['mirror'], { size: p => p.tall ? [.5, .1, 1.5] : [1, .1, 1], mount: 1.1, mountFor: p => p.tall ? .3 : 1.1, variants: [{ tier: 0 }, { tier: 1 }, { tier: 2 }, { tier: 1, round: true }, { tier: 1, tall: true }, { tier: 2, tall: true }], draw: mirror }),
  W('clock', ['clock'], { size: [.5, .1, .5], vb: [-.2, -.1, -.6, .7, .3, .7], mount: 1.7, variants: T3, draw: clock }),
  W('shelf', ['shelf', 'storage'], { size: p => [p.len || 1, .3, tier(p) === 2 ? 1 : .5], mount: 1.3, variants: [{ tier: 0, seed: 1 }, { tier: 1, seed: 2 }, { tier: 2, seed: 3 }, { tier: 1, len: 1.5, seed: 5, wood: '#e9e2d2' }], draw: shelf }),
  W('window', ['window'], { size: p => [p.w || 1.5, .1, p.h || 1.2], vb: p => [-.3, -.1, -.6, (p.w || 1.5) + .3, .4, (p.h || 1.2) + .35], mount: .9, variants: [{ tier: 0 }, { tier: 1 }, { tier: 2 }, { tier: 1, w: 1, c: FAB.mustard }, { tier: 1, w: 2, c: FAB.red, night: true }, { tier: 2, w: 2, c: FAB.sage, sky: '#f7b98a' }, { tier: 1, curtain: false, w: 1 }], draw: win }),
  W('door.front', ['door', 'frontdoor'], { size: [1, .1, 1.75], mount: 0, use: { x: .5, y: .5 }, door: { side: 'y', at: .5 }, variants: [...T3, { tier: 1, c: FAB.blue }, { tier: 1, c: FAB.red }], draw: doorFront }),
  W('door.room', ['door', 'roomdoor'], { size: [1, .1, 1.75], vb: [-.3, -.1, 0, 1.3, 1, 2], mount: 0, use: { x: .5, y: .5 }, door: { side: 'y', at: .5 }, variants: [...T3, { tier: 1, open: true }, { tier: 2, open: true, beyond: '#6a5a4a', floor: '#8a6a4a' }], draw: doorRoom }),
  W('doorway', ['door', 'doorway'], { size: p => [p.w || 1, .1, 1.85], mount: 0, use: { x: .5, y: .5 }, door: { side: 'y', at: .5 }, variants: [...T3, { tier: 1, w: 1.5 }, { tier: 0, bead: true }], draw: doorway }),
  W('coathooks', ['coathooks', 'hall'], { size: [1, .1, .9], vb: [-.3, -.1, 0, 1.3, .5, 1.3], mount: .9, variants: T3, draw: coatHooks }),
  W('fairylights', ['seasonal', 'lights'], { size: p => [p.len || 2, .1, .4], mount: 2, variants: [{ len: 2 }, { len: 3, warm: true }, { len: 1 }], draw: fairy }),
];
