// Laundry furniture for homes (owned by the wardrobe system): hamper, tumble dryer, drying rack. Asset ids furn.home.laundry.<id>; sim/laundry.js registers the
// home goods (hamper_t0/1, dryer_t1, dryrack_t0, washer_t0/1/2) and the fixture handlers for the tags `hamper`, `dryer`, `dryrack`.
import { box, qz, lw, dk, lt } from '../../engine/raster.js';
import { b, blob, dot, shadow } from '../home/_lib.js';

const CL = ['#d9483b', '#5ab0e0', '#e8b83a', '#f4f0e8', '#7a55c8', '#4fa860'];
function hamper(p) {
  const t = p.tier || 0, c = p.c || (t ? '#f1ede4' : '#c8a070'), full = p.full === undefined ? 1 : p.full;
  shadow(-.02, .62, 0, .56);
  box(.05, .05, 0, .5, .4, .62, c, { t: dk(c, .25) });
  if (t) { lw([.05, .45, .2], [.55, .45, .2], dk(c, .18)); lw([.05, .45, .42], [.55, .45, .42], dk(c, .18)); dot(.3, .45, .52, '#9aa0a8'); }
  else for (let z = .1; z < .6; z += .12) lw([.05, .45, z], [.55, .45, z], dk(c, .22));
  if (full) { b(.12, .1, .62, .18, .2, .08, CL[0]); b(.3, .14, .62, .2, .22, .1, CL[1]); b(.2, .22, .66, .16, .14, .08, CL[2]); lw([.5, .3, .62], [.56, .46, .4], CL[3]); }
}
function dryer(p) {
  const c = p.c || '#f4f1ea';
  shadow(-.02, 1.05, 0, .58);
  b(.03, .03, 0, .94, .42, .05, dk(c, .6)); box(0, 0, .04, 1, .5, .84, c, { t: lt(c, .1) });
  lw([0, .5, .74], [1, .5, .74], dk(c, .35)); blob(.5, .5, .4, 5.5, 5.5, '#8e979d'); blob(.5, .5, .4, 4.4, 4.4, p.on ? '#f0b060' : '#3a3442');
  if (p.on) { blob(.5, .5, .38, 2.2, 1.6, CL[1]); dot(.5, .5, .46, '#fff8e0', -1, 0); } else blob(.5, .5, .36, 2.4, 1.4, '#55506a');
  dot(.2, .5, .81, '#e05a3a'); dot(.2, .5, .81, '#e05a3a', 1, 0); dot(.8, .5, .81, '#8e979d'); qz(.1, .9, .1, .4, .885, dk(c, .06));
}
function dryrack(p) {
  const m = '#c2cad0', n = p.empty ? 0 : 5;
  shadow(.05, 1.15, .05, .5);
  for (const x of [.1, 1.1]) { lw([x, .1, 0], [x, .45, 1], m); lw([x, .45, 0], [x, .1, 1], m); }
  for (const y of [.1, .28, .45]) lw([.1, y, 1], [1.1, y, 1], m);
  lw([.1, .28, .55], [1.1, .28, .55], dk(m, .15));
  for (let i = 0; i < n; i++) { const x = .18 + i * .18, c = CL[(i + (p.seed || 0)) % CL.length], y = [.45, .28, .45, .1, .45][i]; b(x, y, .62 + (i % 2) * .08, .14, .02, .38 - (i % 2) * .08, c); }
}
const A = (id, tags, o) => Object.assign({ id: 'furn.home.laundry.' + id, kind: 'furniture', tags: ['home', 'laundryroom', ...tags] }, o);
export default [
  A('hamper', ['hamper'], { size: [.6, .5, .75], vb: [-.3, -.3, 0, .9, .8, 1.1], use: { x: .3, y: .85 }, variants: [{ tier: 0 }, { tier: 1 }, { tier: 0, full: 0 }], draw: hamper }),
  A('dryer', ['dryer'], { size: [1, .5, .9], vb: [-.3, -.3, 0, 1.3, .8, 1.5], use: { x: .5, y: .85 }, variants: [{}, { on: true }], draw: dryer }),
  A('dryrack', ['dryrack'], { size: [1.2, .55, 1.05], vb: [-.3, -.3, 0, 1.5, .85, 1.4], use: { x: .6, y: .9 }, variants: [{}, { empty: true }], draw: dryrack }),
];
