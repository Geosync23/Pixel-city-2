// House plants (evergreen indoors: not seasonal). Tier = pot quality. All are 0.5 x 0.5 on the floor except the hanging plant (ceiling).
import { box, qy, qx, qz, lw, fq, fill, PW, cyl, ball, rng, dk, lt } from '../../engine/raster.js';
import { tier, wood, FAB, b, leg, pole, shadow, dot, blob, oblob } from './_lib.js';

const GOLD = '#d9b65c', G = ['#2f7a48', '#3f9a55', '#58b868', '#7fcf7a'];
function pot(p, r = .15, h = .26) {
  const t = tier(p), c = p.pot || ['#c9764a', '#f1eee6', '#3b4560'][t];
  shadow(.08, .46, .08, .46);
  if (t === 2) { for (const [dx, dy] of [[-.11, .1], [.11, .1], [0, -.1]]) leg(.25 + dx, .25 + dy, 0, .16, GOLD); cyl(.25, .25, .14, r, h, c, { t: '#4a3626' }); lw([.25 - r, .25 + r, .14 + h - .04], [.25 + r, .25 + r, .14 + h - .04], GOLD); return .14 + h; }
  cyl(.25, .25, 0, r - .02, h, c, { t: '#4a3626' }); cyl(.25, .25, h - .05, r, .05, t ? c : lt(c, .1), { t: '#4a3626' });
  if (t === 1) { lw([.25 - r + .04, .25 + r, h * .5], [.25 + r - .04, .25 + r, h * .5], p.c2 || FAB.teal); } else dot(.2, .4, .1, dk(c, .3));
  return h;
}
/** a leaf as a screen-space ellipse with a mid rib, centred at a world point */
function leaf(x, y, z, rx, ry, c, split) { oblob(x, y, z, rx, ry, c); const s = PW(x, y, z); blob(x, y, z + .03, rx * .5, ry * .45, lt(c, .18)); if (split) { dot(x, y, z, dk(c, .6), -Math.round(rx * .6), 0); dot(x, y, z, dk(c, .6), Math.round(rx * .6), 1); dot(x, y, z, dk(c, .6), 0, Math.round(ry * .7)); } }
function monstera(p) {
  const z0 = pot(p, .16, .28), r = rng(p.seed || 3), n = 7 + tier(p);
  const L = []; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + r(), rad = .12 + r() * .34, h = .35 + r() * .75 + (i % 3 === 0 ? .3 : 0); L.push([.25 + Math.cos(a) * rad, .25 + Math.sin(a) * rad, z0 + h, 3.4 + r() * 2.2]); }
  L.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]) || a[2] - b[2]);
  for (const l of L) lw([.25, .25, z0], [l[0], l[1], l[2]], '#3a7a48');
  L.forEach((l, i) => leaf(l[0], l[1], l[2], l[3], l[3] * .8, G[i % 3], true));
}
function fiddle(p) {
  const z0 = pot(p, .16, .3), r = rng(p.seed || 5), H = p.h || 1.9;
  lw([.25, .25, z0], [.27, .25, H - .5], '#6b4630'); lw([.25 + 1 / 16, .25, z0], [.27 + 1 / 16, .25, H - .5], '#4a3020');
  const L = []; for (let i = 0; i < 13; i++) { const k = i / 12, a = i * 2.4 + r(), rad = .1 + (1 - Math.abs(k - .45)) * .2 * r() + .08; L.push([.25 + Math.cos(a) * rad, .25 + Math.sin(a) * rad, H - .95 + k * .85, 3 + r() * 1.6]); }
  L.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]) || a[2] - b[2]);
  L.forEach((l, i) => leaf(l[0], l[1], l[2], l[3] * .85, l[3] * 1.15, ['#2f6f42', '#3a8a4c', '#4a9d5a'][i % 3], false));
}
function snake(p) {
  const z0 = pot(p, .15, .24), r = rng(p.seed || 2);
  const L = []; for (let i = 0; i < 7; i++) { const a = i * .9 + r(), rad = .04 + r() * .09; L.push([.25 + Math.cos(a) * rad, .25 + Math.sin(a) * rad, .45 + r() * .5 + (i === 3 ? .15 : 0), Math.cos(a) * .1]); }
  L.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
  L.forEach((l, i) => { const a = PW(l[0], l[1], z0), t = PW(l[0] + l[3], l[1] - l[3], z0 + l[2]), n = Math.round(a[1] - t[1]), c = ['#2f7a48', '#3f9a55', '#4aa862'][i % 3];
    for (let k = 0; k <= n; k++) { const f = k / n, X = Math.round(a[0] + (t[0] - a[0]) * f), Y = Math.round(a[1]) - k, w = f > .82 ? 0 : 1; for (let d = -w; d <= w; d++) fill([[X + d, Y], [X + d + 1, Y], [X + d + 1, Y + 1], [X + d, Y + 1]], (d === -w && w) ? '#d9cf6a' : (d === w && w) ? dk(c, .3) : (k % 4 === 2 ? dk(c, .18) : c)); } });
}
function cactus(p) {
  const z0 = pot(p, .15, .22), k = p.kind || 'saguaro', c = '#4f9a62';
  if (k === 'saguaro') {
    box(.02, .2, z0 + .52, .1, .1, .3, c, { t: lt(c, .2) }); b(.06, .21, z0 + .5, .14, .08, .09, c);
    cyl(.25, .25, z0, .09, .95, c, { t: lt(c, .2) }); lw([.25, .345, z0 + .02], [.25, .345, z0 + .93], dk(c, .28)); lw([.2, .33, z0 + .02], [.2, .33, z0 + .93], lt(c, .25));
    b(.3, .21, z0 + .36, .14, .08, .09, c); box(.38, .2, z0 + .38, .1, .1, .4, c, { t: lt(c, .2) });
    dot(.25, .25, z0 + 1.0, '#f2a7c3'); dot(.25, .25, z0 + 1.0, '#e98aa4', 1, 0); dot(.25, .25, z0 + 1.0, '#f7c1d4', 0, -1); dot(.43, .25, z0 + .82, '#f2a7c3');
  } else {
    ball(.25, .25, z0 + .14, .17, c, { squash: .9 }); for (const dx of [-3, 0, 3]) for (const dy of [-2, 2]) dot(.25, .25, z0 + .14, '#e3f0d8', dx, dy); dot(.25, .25, z0 + .36, '#f2a7c3'); dot(.25, .25, z0 + .36, '#e98aa4', 1, 0); dot(.25, .25, z0 + .36, '#f7c1d4', 0, -1);
  }
}
function hanging(p) {
  const t = tier(p), c = p.pot || ['#c9764a', '#f1eee6', '#d9b65c'][t], r = rng(p.seed || 4), top = 1.2;
  // local z=0 is the lowest vine tip; the hook is at z = 1.2 (mount the asset so that its top touches the ceiling)
  for (const [dx, dy] of [[-.13, .1], [.13, .1], [0, -.12]]) lw([.25, .25, top], [.25 + dx, .25 + dy, .78], '#e9dcc0');
  dot(.25, .25, top, '#8e979d');
  const L = []; for (let i = 0; i < 7; i++) { const a = i * .9 + r(), rad = .15 + r() * .08, len = .25 + r() * .5; L.push([.25 + Math.cos(a) * rad, .25 + Math.sin(a) * rad, len]); }
  L.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
  const vine = l => { for (let z = .72; z > .72 - l[2]; z -= .09) { dot(l[0], l[1], z, G[1]); dot(l[0], l[1], z, G[(Math.round(z * 30)) % 2 ? 2 : 0], (Math.round(z * 11) % 2) ? 1 : -1, 0); dot(l[0], l[1], z - .045, G[0]); } };
  L.slice(0, 3).forEach(vine);
  cyl(.25, .25, .56, .14, .2, c, { t: '#4a3626' }); if (t) lw([.11, .39, .66], [.39, .39, .66], t === 2 ? '#f8f5ee' : FAB.teal);
  blob(.25, .25, .84, 5, 3, G[1]); blob(.2, .25, .9, 3, 2, G[2]); blob(.32, .25, .88, 2.4, 1.8, G[0]);
  L.slice(3).forEach(vine);
}
const P = (id, tags, h, draw, variants, x) => Object.assign({ id: 'furn.home.plant.' + id, kind: 'furniture', tags: ['home', 'decor', 'plant', ...tags], size: [.5, .5, h], vb: [-.4, -.4, 0, .9, .9, h + .3], variants, draw }, x);
const T3 = [{ tier: 0 }, { tier: 1 }, { tier: 2 }];
export default [
  P('monstera', ['monstera'], 1.5, monstera, [{ tier: 0, seed: 3 }, { tier: 1, seed: 7 }, { tier: 2, seed: 11 }]),
  P('fiddle', ['fiddle', 'tree'], 2, fiddle, [{ tier: 0, seed: 5 }, { tier: 1, seed: 8 }, { tier: 2, seed: 2 }]),
  P('snake', ['snakeplant'], 1.2, snake, [{ tier: 0, seed: 2 }, { tier: 1, seed: 6 }, { tier: 2, seed: 9 }]),
  P('cactus', ['cactus'], 1.4, cactus, [{ tier: 0 }, { tier: 1 }, { tier: 2 }, { tier: 1, kind: 'ball' }]),
  P('hanging', ['hanging'], 1.2, hanging, [{ tier: 0, seed: 4 }, { tier: 1, seed: 6 }, { tier: 2, seed: 9 }], { ceiling: true, mount: 1.4, solid: false }),
];
