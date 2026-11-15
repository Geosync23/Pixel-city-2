// More homes (owner msg 107): the few built-in pieces the new house interiors needed (ids `furn.home.more.*`). Everything else comes from src/art/home.
//   more.stairwell   the top of a staircase seen from the upper floor: an opening in the floor with a banister on three sides, steps going DOWN towards
//                    local x = 0; you step in from the open end (x = len). p: len (2), c (wood), runner (carpet colour), rail (banister colour)
//   more.garagedoor  wall piece: a sectional garage door. p: w (3), h (2.1), c, win (a row of small windows)
//   more.trapdoor    wall piece: a loft hatch with its fold-down ladder (the way up to an attic). p: c (wood)
import { box, qy, qz, lw, dk, lt } from '../../engine/raster.js';

function stairwell(p) {
  const L = p.len || 2, c = p.c || '#9c6a3e', rail = p.rail || '#f4f1ea', run = p.runner, n = Math.round(L / .25), s = L / n;
  qz(0, L, .06, .94, .004, '#1f1d27');                                               /* the dark of the floor below */
  for (let j = 0; j < n; j++) { const k = j / (n - 1), col = dk(c, .62 - k * .5);     /* treads: bright at the top (open end), dim at the bottom */
    qz(j * s + .02, (j + 1) * s - .03, .1, .9, .006, col); if (run) qz(j * s + .02, (j + 1) * s - .03, .3, .7, .008, dk(run, .55 - k * .45)); }
  lw([L, .06, .01], [L, .94, .01], lt(c, .1));
  const post = (x, y) => box(x - .04, y - .04, 0, .08, .08, .92, rail, { ol: false, l: dk(rail, .1), r: dk(rail, .25), t: rail });
  for (const y of [.04, .96]) { for (let x = 0; x <= L + .01; x += .5) post(Math.min(x, L - .02), y); lw([0, y, .9], [L, y, .9], dk(c, .25)); lw([0, y, .94], [L, y, .94], c); lw([0, y, .45], [L, y, .45], dk(rail, .15)); }
  post(.02, .5); lw([.02, .04, .9], [.02, .96, .9], dk(c, .25)); lw([.02, .04, .94], [.02, .96, .94], c); lw([.02, .04, .45], [.02, .96, .45], dk(rail, .15));
}
function garageDoor(p) {
  const w = p.w || 3, h = p.h || 2.1, c = p.c || '#e9e4d8', fr = '#3a3440', n = 4;
  qy(-.08, w + .08, .05, 0, h + .1, fr); qy(0, w, .06, 0, h, c);
  for (let i = 1; i < n; i++) lw([0, .07, h * i / n], [w, .07, h * i / n], dk(c, .28));
  for (let i = 0; i < n; i++) for (let x = .25; x < w - .2; x += .75) qy(x, x + .5, .07, h * i / n + .1, h * (i + 1) / n - .1, dk(c, .06), dk(c, .12));
  if (p.win !== false) for (let x = .25; x < w - .2; x += .75) qy(x + .04, x + .46, .075, h * 3 / n + .14, h - .14, '#bfe4f2', '#8fc4dc');
  qy(w / 2 - .12, w / 2 + .12, .08, .12, .18, '#8e979d');
}
function trapdoor(p) {
  const c = p.c || '#9c6a3e';
  qy(.1, .9, .05, 2.2, 2.3, dk(c, .3)); qy(.14, .86, .05, 2.02, 2.2, '#1f1d27');     /* the open hatch */
  for (const x of [.24, .76]) lw([x, .3, 0], [x, .06, 2.1], dk(c, .1)); for (let z = .25; z < 2; z += .3) { const y = .3 - .24 * z / 2.1; lw([.24, y, z], [.76, y, z], lt(c, .12)); }
}
const A = (id, tags, o) => Object.assign({ id: 'furn.home.more.' + id, kind: 'furniture', tags: ['home', 'build', ...tags] }, o);
export default [
  A('stairwell', ['stairs'], { size: p => [p.len || 2, 1, .95], vb: p => [-.1, -.1, 0, (p.len || 2) + .1, 1.1, 1.1], variants: [{}, { len: 2, runner: '#b8433a' }, { len: 2.5, c: '#5e3f30', runner: '#c9a24a' }], draw: stairwell }),
  A('garagedoor', ['wall', 'door'], { wall: true, solid: false, size: p => [p.w || 3, .1, p.h || 2.1], vb: p => [-.2, -.1, 0, (p.w || 3) + .2, .3, (p.h || 2.1) + .2], mount: 0, variants: [{}, { c: '#5a6a7a' }, { w: 2.5, win: false, c: '#8a5a3a' }], draw: garageDoor }),
  A('trapdoor', ['wall', 'door'], { wall: true, solid: false, size: [1, .4, 2.3], vb: [0, -.1, 0, 1, .5, 2.4], mount: 0, variants: [{}, { c: '#5e3f30' }], draw: trapdoor }),
];
