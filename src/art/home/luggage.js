// The player's own suitcase from the intro (docs/reports/luggage.md): the rolling case towed behind the player (fx.luggage.tow, drawn by sim/luggage.js as a
// follower entity) and the same case parked by the flat's front door as one more thing to unpack (furn.home.suitcase, an intro "moving box": housing.js).
// Colours = the bag on carousel 2 (furn.airport.bag { mine }): yellow, red maple-leaf tag, teal ribbon.
// fx.luggage.tow p = { th: tilt from upright in degrees, ph: heading of the tilt in degrees (atan2 in world x/y: the way the handle leans), f: wobble frame }.
//   Origin = the middle of the case's foot on the ground; the case leans over its wheels (the low edge on the handle side) and the pulled-out handle reaches
//   L = H + HD from the foot along the case's axis (sim/luggage.js puts the grip in the player's hand).
import { fq, lw, at, dk, lt } from '../../engine/raster.js';

export const LUG = { D: .22, W: .3, H: .38, HD: .18, WHL: .04, C: '#f2c230', TAG: '#d2412f', RIB: '#2f8f96', ROD: '#5a6270', GRIP: '#3a4250', TYRE: '#2a2733' };
const R = Math.PI / 180;
/* the 8 corners: index bits i (a axis), j (l axis), k (u axis) */
const EDGES = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
const FACES = [  // corner indices (ordered round the face), axis, sign
  [[1, 3, 7, 5], 'a', 1], [[0, 2, 6, 4], 'a', -1], [[2, 3, 7, 6], 'l', 1], [[0, 1, 5, 4], 'l', -1], [[4, 5, 7, 6], 'u', 1], [[0, 2, 3, 1], 'u', -1]];

export function drawCase(p) {
  const { D, W, H, WHL, C } = LUG, HD = p.park ? .07 : LUG.HD, th = (p.th || 0) * R, ph = (p.ph || 0) * R, ct = Math.cos(th), st = Math.sin(th), cp = Math.cos(ph), sp = Math.sin(ph);
  const ax = { u: [st * cp, st * sp, ct], a: [ct * cp, ct * sp, -st], l: [-sp, cp, 0] }, lift = WHL + D / 2 * st;
  const pt = (i, j, k) => [i * D * ax.a[0] + j * W * ax.l[0] + k * ax.u[0], i * D * ax.a[1] + j * W * ax.l[1] + k * ax.u[1], lift + i * D * ax.a[2] + j * W * ax.l[2] + k * ax.u[2]];
  const cn = []; for (let n = 0; n < 8; n++) cn.push(pt((n & 1) ? .5 : -.5, (n & 2) ? .5 : -.5, (n & 4) ? H : 0));
  // shadow on the floor under the case
  { const s = []; for (let n = 0; n < 10; n++) { const q = n / 10 * Math.PI * 2; s.push([Math.cos(q) * .2, Math.sin(q) * .2, 0]); } fq(s, '#2a1f4560'); }
  // wheels: the low edge (handle side, +a), two small tyres
  for (const j of [-.38, .38]) { const w = pt(.5, j, 0); lw([w[0], w[1], 0], [w[0], w[1], Math.max(.01, w[2])], LUG.TYRE); }
  const vis = [], cnt = {};
  for (const [ix, k, sg] of FACES) {
    const v = ax[k], n = [v[0] * sg, v[1] * sg, v[2] * sg]; if (n[0] + n[1] + n[2] <= 0.02) continue;
    const col = n[2] > .55 ? lt(C, .08) : n[0] >= n[1] ? dk(C, .3) : dk(C, .14); vis.push({ ix, k, sg, col, n });
    fq(ix.map(q => cn[q]), col);
    for (let e = 0; e < 4; e++) { const a = ix[e], b = ix[(e + 1) % 4], key = a < b ? a + '-' + b : b + '-' + a; cnt[key] = (cnt[key] || 0) + 1; }
  }
  // the zip band round the middle of the shell, on the side faces
  for (const f of vis) if (f.k !== 'u') { const q = f.ix.map(i => cn[i]), m = (A, B, t) => [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t];
    /* the face's corners run bottom, bottom, top, top for the a / l faces (see FACES) */ fq([m(q[0], q[3], .46), m(q[1], q[2], .46), m(q[1], q[2], .53), m(q[0], q[3], .53)], dk(f.col, .28)); }
  // the red maple-leaf tag on the face away from the handle (or a side)
  { const f = vis.find(x => x.k === 'a' && x.sg < 0) || vis.find(x => x.k === 'l'); if (f) { const q = f.ix.map(i => cn[i]), m = (s, t) => { const b0 = [q[0][0] + (q[1][0] - q[0][0]) * s, q[0][1] + (q[1][1] - q[0][1]) * s, q[0][2] + (q[1][2] - q[0][2]) * s], t0 = [q[3][0] + (q[2][0] - q[3][0]) * s, q[3][1] + (q[2][1] - q[3][1]) * s, q[3][2] + (q[2][2] - q[3][2]) * s]; return [b0[0] + (t0[0] - b0[0]) * t, b0[1] + (t0[1] - b0[1]) * t, b0[2] + (t0[2] - b0[2]) * t]; };
    fq([m(.55, .62), m(.82, .62), m(.82, .84), m(.55, .84)], LUG.TAG); } }
  // outline: the silhouette edges (on exactly one visible face) dark, the rest a soft crease
  const o = dk(C, .62); for (const [a, b] of EDGES) { const c = cnt[a < b ? a + '-' + b : b + '-' + a]; if (c === 1) lw(cn[a], cn[b], o); else if (c === 2) lw(cn[a], cn[b], lt(C, .22)); }
  // the pulled-out handle: two rods from the top on the handle side, the grip across their ends
  const top = j => pt(.3, j, H), tip = j => pt(.3, j, H + HD), r0 = top(-.22), r1 = top(.22), g0 = tip(-.22), g1 = tip(.22);
  lw(r0, g0, LUG.ROD); lw(r1, g1, LUG.ROD); lw(g0, g1, LUG.GRIP);
  if (!p.park) { const rb = pt(.3, -.22, H + HD * .45); lw(rb, [rb[0], rb[1], rb[2] - .06], LUG.RIB); }
}

export default [
  { id: 'fx.luggage.tow', kind: 'fx', tags: ['luggage_fx'], solid: false, size: [.3, .3, .5], vb: [-.95, -.95, 0, .95, .95, 1.05],
    variants: [{ th: 0, ph: 0 }, { th: 40, ph: 0 }, { th: 40, ph: 90 }, { th: 40, ph: 180 }, { th: 40, ph: 270 }], draw: drawCase },
  { id: 'furn.home.suitcase', kind: 'furniture', tags: ['home', 'decor', 'moving', 'moving_box'], size: [.5, .5, .6], vb: [-.2, -.2, 0, .7, .7, 1], use: { x: .25, y: .85 },
    variants: [{}], draw: () => at(.25, .25, 0, () => drawCase({ th: 0, ph: 90, park: 1 })) },
];
