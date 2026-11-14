// Maple Bay Botanical Conservatory — structure, water and furniture. ids furn.cons.* (plants live in conservatory_plants.js, helpers in _cons_lib.js)
//   glasswall  wall art (wall: true, mount 0): iron-ribbed glass with the park outside + a curved eave of roof glass.
//              p: { w, u0 (scenery offset in units), time 'day'|'dusk'|'night', season 0-3, frame 0-3 (snow / rain), wx: 'rain'|null }
//   partition {w} glass screen   arch {w, name} iron archway (walk through)   gate {w, open} ticket gate   shaft (flat light shaft)
//   lilypool {frame 0-3} the Victoria amazonica pool + fountain   waterfall {frame 0-3}   stream {len, slabs: [y..], frame 0-3} (flat)
//   koipond {frame 0-3} (flat; geometry in _cons_lib POND)   bridge / bridgerail {len, h} (the deck is flat: characters get zoff = archZ)
//   bench (tag cons_bench)  plaque (cons_plaque)  lamp  lantern  feeder (cons_koifeed)  nectar (cons_bfly)  puparium  sketchboard {n}  sketchspot (cons_sketch)
//   seedtable (cons_seedling)  counter {kind: 'gift'|'cafe'|'ticket', w}  shelf {kind, w, name}  banner {season}  mister {w, frame}  mapboard (cons_map)  barrow
import * as R from '../../engine/raster.js';
import { IRON, IRON_D, IRON_L, STONE, STONE_D, SOIL, MOSS, WOOD, RED, WATER, GREENS, S2, dot, blob, oblob, rosette, flower, POND, pondIn, archZ } from './_cons_lib.js';
const { box, qy, qx, qz, fq, lw, lit, glow, cyl, ball, dk, lt, mix, PW, px, C, rng, at, line, ellipse, hash2, signY, textY, PAT } = R;
const CREAM = '#f4ead0', GREEN = '#2f6a58', GOLD = '#e8c06a';

/* ---------- the glass walls ---------- */
const SKY = { day: ['#8fd0ec', '#b4e2f2', '#dcf2f4'], dusk: ['#6a6aa8', '#f09a70', '#ffd9a0'], night: ['#141a36', '#1c2648', '#2a3862'], wday: ['#b4c6d8', '#ccdae6', '#e4edf2'] };
const LEAF = [['#7cc75e', '#f2a7c3', '#8fd06a', '#f7c1d4'], ['#4f9a45', '#5aa84f', '#458c40', '#62b356'], ['#e08a2c', '#d9562b', '#e8b63a', '#c9792a'], ['#8a7a70', '#7a6a64', '#8a7a70', '#7a6a64']];
function outside(u, v, time, s, f, wx) { // colour of the view through the glass at pixel (u along the wall, v up from the floor)
  const night = time === 'night', dusk = time === 'dusk', K = SKY[!night && !dusk && s === 3 ? 'wday' : time], odd = (u + v) & 1;
  let c = v > 50 ? K[0] : v > 44 ? (odd ? K[0] : K[1]) : v > 30 ? K[1] : v > 24 ? (odd ? K[1] : K[2]) : K[2], lite = false;
  if (night && v > 26 && hash2(u, v, 9) > .9965) { c = '#fff4d0'; lite = true; }
  const tint = h => night ? mix(h, '#10162e', .78) : dusk ? mix(h, '#7a3a50', .34) : h;
  // far tree line
  if (v < 15 + Math.sin(u / 23) * 3 + Math.sin(u / 7) * 1.5) c = tint(s === 3 ? '#c8d4dc' : mix(LEAF[s][1], '#a8c8d0', .5));
  // park trees
  const k0 = Math.floor(u / 22);
  for (let k = k0 - 1; k <= k0 + 1; k++) {
    const cu = k * 22 + hash2(k, 3, 1) * 12, rad = 7 + hash2(k, 5, 2) * 6, cv = 20 + hash2(k, 8, 4) * 16, du = u - cu, dv = v - cv;
    if (Math.abs(du) < 1.2 && v < cv) c = tint('#6a4a3a');
    const q = du * du / (rad * rad) + dv * dv / (rad * rad * .7);
    if (q < 1) { if (s === 3) { if (dv > rad * .28) c = night ? '#8a94b0' : '#f4f8fb'; else if (Math.abs(du) < 1.2 || ((u + (v >> 1) + k) % 5 === 0 && dv > -rad * .5) || ((u - (v >> 1) + k) % 7 === 0 && dv > -rad * .5)) c = tint('#6a5a54'); }
      else c = tint(LEAF[s][(k & 3)] === undefined ? LEAF[s][0] : (-du * .5 + dv * .8 > rad * .25 ? lt(LEAF[s][k & 3], .22) : q > .7 && dv < 0 ? dk(LEAF[s][k & 3], .25) : LEAF[s][k & 3])); }
  }
  // park lamps at night / dusk
  if ((night || dusk) && v > 13 && v < 16 && (u % 61 === 30 || u % 61 === 31)) { c = '#ffe9a0'; lite = true; }
  if (s === 3 && v > 9 && hash2(u, v + f * 5, 5) > .988) c = night ? '#c8d0e8' : '#ffffff';
  if (wx === 'rain' && ((u * 3 + v + f * 7) % 19 === 0) && hash2(u, (v + f * 7) >> 2, 2) > .4) c = night ? '#5a6a90' : '#eaf6fb';
  if (v < 9) c = tint(s === 3 ? '#e6edf2' : mix(R.grassC()[0], '#74b85c', .5));
  return [c, lite];
}
function glasswall(p) {
  const w = p.w || 4, y = .1, time = p.time || 'day', s = p.season === undefined ? 1 : p.season, u0 = Math.round((p.u0 || 0) * 16), f = p.frame || 0, H = 4.2, n = Math.round(w * 16);
  qy(0, w, y, 0, .5, PAT.brick('#b8674e'));
  for (let i = 0; i < n; i++) { const q = PW((i + .5) / 16, y, .5), X = Math.floor(q[0]), Y = Math.round(q[1]); for (let v = 0; v < 60; v++) { const o = outside(u0 + i, v, time, s, f, p.wx); if (o[1]) lit(() => px(X, Y - 1 - v, C(o[0]))); else px(X, Y - 1 - v, C(o[0])); } }
  // sheen
  for (let k = 0; k < w; k += 2) if ((k / 2 + (u0 >> 5)) % 2 === 0) { fq([[k + .55, y, 3.3], [k + .68, y, 3.3], [k + .3, y, 2.3], [k + .17, y, 2.3]], '#f4fcff', 'glass'); fq([[k + .85, y, 3.1], [k + .9, y, 3.1], [k + .7, y, 2.6], [k + .65, y, 2.6]], '#f4fcff', 'glass'); }
  // ironwork: transoms, mullions, arches, main ribs
  for (const z of [1.5, 2.5]) lw([0, y, z], [w, y, z], IRON);
  for (let x = 1; x < w; x += 2) lw([x, y, .5], [x, y, 4.14], IRON_D);
  for (let x0 = 0; x0 < w; x0 += 2) { let pr = null; for (let i = 0; i <= 10; i++) { const t = i / 10, q = S2(x0 + 2 * t, y, 3.45 + .7 * Math.sin(Math.PI * t)); if (pr) { line(pr, q, IRON); line([pr[0], pr[1] + 1], [q[0], q[1] + 1], IRON_D); } pr = q; }
    for (const t of [.25, .75]) lw([x0 + 2 * t, y, 3.45 + .7 * Math.sin(Math.PI * t)], [x0 + 2 * t, y, 4.2], IRON_D); const q = S2(x0 + 1, y, 3.8); for (const [dx, dy] of [[0, -2], [1, -1], [2, 0], [1, 1], [0, 2], [-1, 1], [-2, 0], [-1, -1]]) px(q[0] + dx, q[1] + dy, C(IRON)); }
  for (let x = 0; x <= w + .01; x += 2) { const a = Math.max(0, x - .06), b = Math.min(w, x + .06); qy(a, b, y, .5, H, IRON); lw([a, y, .5], [a, y, H], IRON_L); }
  qy(0, w, y, .5, .6, STONE); lw([0, y, .6], [w, y, .6], lt(STONE, .3)); qy(0, w, y, H, H + .14, IRON_D); lw([0, y, H + .14], [w, y, H + .14], IRON_L);
  // the curved eave: roof glass leaning in over the room
  const rz = H + .14, ry1 = .75, rz1 = 4.95, ry2 = 1.5, rz2 = 5.2, rc = time === 'night' ? '#26335a' : time === 'dusk' ? '#ffd0a0' : '#eaf8fc';
  fq([[0, y, rz], [w, y, rz], [w, ry1, rz1], [0, ry1, rz1]], rc, 'glass'); fq([[0, ry1, rz1], [w, ry1, rz1], [w, ry2, rz2], [0, ry2, rz2]], rc, 'glass');
  for (let x = 0; x <= w + .01; x += 1) { const c = x % 2 ? IRON_D : IRON; lw([x, y, rz], [x, ry1, rz1], c); lw([x, ry1, rz1], [x, ry2, rz2], c); }
  lw([0, ry1, rz1], [w, ry1, rz1], IRON); lw([0, ry2, rz2], [w, ry2, rz2], IRON); lw([0, ry2, rz2 - .06], [w, ry2, rz2 - .06], IRON_D);
}
function partition(p) {
  const w = p.w || 4; box(0, 0, 0, w, .2, .3, STONE, { t: lt(STONE, .15) });
  qy(0, w, .1, .3, 2.3, '#dff6f0', 'glass'); for (let x = .4; x < w; x += 2) fq([[x + .3, .1, 2.0], [x + .4, .1, 2.0], [x + .15, .1, 1.1], [x + .05, .1, 1.1]], '#ffffff', 'glass');
  lw([0, .1, 1.3], [w, .1, 1.3], IRON);
  for (let x = 0; x <= w + .01; x += 1) { const a = Math.min(w - .08, Math.max(0, x - .04)); box(a, .06, .3, .08, .08, 2.05, IRON, { ol: false }); dot(a + .04, .1, 2.5, GOLD); }
  box(0, .05, 2.3, w, .1, .08, IRON_D, { t: IRON, ol: false }); lw([0, .15, 2.38], [w, .15, 2.38], IRON_L);
}
function arch(p) {
  const w = p.w || 2, nm = p.name || '', y = .15;
  for (const x of [0, w - .14]) { box(x, .06, 0, .14, .18, 2.3, IRON); box(x - .03, .03, 0, .2, .24, .2, IRON_D, { ol: false }); }
  let pr = null; for (let i = 0; i <= 16; i++) { const t = i / 16, q = S2(.07 + (w - .14) * t, y, 2.3 + .8 * Math.sin(Math.PI * t)); if (pr) for (let o = -1; o <= 1; o++) line([pr[0], pr[1] + o], [q[0], q[1] + o], o < 0 ? IRON_L : o ? IRON_D : IRON); pr = q; }
  pr = null; for (let i = 0; i <= 12; i++) { const t = i / 12, q = S2(.2 + (w - .4) * t, y, 2.25 + .45 * Math.sin(Math.PI * t)); if (pr) line(pr, q, IRON_D); pr = q; }
  for (const t of [.2, .35, .65, .8]) lw([.2 + (w - .4) * t, y, 2.25 + .45 * Math.sin(Math.PI * t)], [.07 + (w - .14) * t, y, 2.3 + .8 * Math.sin(Math.PI * t)], IRON_D);
  if (nm) { const tw = (R.textW(nm) + 6) / 16; signY(nm, w / 2 - tw / 2, w / 2 + tw / 2, y + .02, 2.52, 2.95, GREEN, CREAM); dot(w / 2, y, 3.16, GOLD); dot(w / 2, y, 3.16, GOLD, 0, -1); }
}
function gate(p) {
  const w = p.w || 3.5, y = .15;
  for (const x of [0, w - .3]) { box(x, 0, 0, .3, .3, 1, STONE); ball(x + .15, .15, 1.12, .13, lt(STONE, .1)); }
  if (p.open) { for (const x of [.3, w - .3]) { for (let q = -.85; q <= .05; q += .18) lw([x, q, .08], [x, q, .8], IRON); lw([x, -.9, .8], [x, .1, .8], IRON_D); lw([x, -.9, .3], [x, .1, .3], IRON_D); } lit(() => qy(.02, .28, .31, .55, .8, '#4fbf6a')); }
  else { for (let x = .4; x < w - .3; x += .2) { lw([x, y, .08], [x, y, .8 + .08 * Math.sin((x - .3) / (w - .6) * Math.PI)], IRON); dot(x, y, .86 + .08 * Math.sin((x - .3) / (w - .6) * Math.PI), GOLD); } lw([.3, y, .8], [w - .3, y, .8], IRON_D); lw([.3, y, .3], [w - .3, y, .3], IRON_D); signY('TICKETS', w / 2 - 1, w / 2 + 1, y + .02, .36, .72, RED, CREAM); lit(() => qy(.02, .28, .31, .55, .8, '#e8483b')); }
}
function shaft() { for (let k = 0; k < 3; k++) { const x = k * 1.2; fq([[x, 0, .01], [x + .9, 0, .01], [x + 2.6, 5, .01], [x + 1.7, 5, .01]], '#fff8d0', 'glass'); } }

/* ---------- water ---------- */
function ring(s, rad, c, f, gap = 3) { const n = Math.round(rad * 2.2); for (let i = 0; i < n; i++) { if ((i + f) % gap === 0) continue; const a = i / n * 6.283; px(Math.round(s[0] + Math.cos(a) * rad), Math.round(s[1] + Math.sin(a) * rad / 2), C(c)); } }
function pad(x, y, z, rx, big) {
  const s = PW(x, y, z), ry = rx / 2; ellipse(s[0], s[1], rx + 1, ry + 1, '#2f6a3a'); ellipse(s[0], s[1], rx, ry, '#52a856'); ellipse(s[0] - 1, s[1] - .5, rx - 2, ry - 1.2, '#68c066');
  if (big) { for (let a = 0; a < 6.283; a += .785) line([Math.round(s[0]), Math.round(s[1])], [Math.round(s[0] + Math.cos(a) * (rx - 2)), Math.round(s[1] + Math.sin(a) * (ry - 1))], '#4a9a50');
    const n = Math.round(rx * 4); for (let i = 0; i <= n; i++) { const a = i / n * 6.283, X = Math.round(s[0] + Math.cos(a) * rx), Y = Math.round(s[1] + Math.sin(a) * ry); if (Math.sin(a) < .15) { px(X, Y - 1, C('#9ae08a')); px(X, Y, C('#7fcf7a')); } else { px(X, Y, C('#8a4a4a')); px(X, Y + 1, C('#6a3a3e')); } } }
  else { px(Math.round(s[0] + rx - 1), Math.round(s[1]), C('#2c8098')); px(Math.round(s[0] + rx - 2), Math.round(s[1]), C('#2c8098')); }
}
function lotus(x, y, z, c = '#fff4f6') { const s = S2(x, y, z); for (const [dx, dy, k] of [[0, 0, 0], [-1, 0, 0], [1, 0, 0], [-2, -1, 1], [2, -1, 1], [0, -1, 0], [-1, -2, 1], [1, -2, 1], [0, -2, 0], [0, -3, 1], [-2, 0, 1], [2, 0, 1]]) px(s[0] + dx, s[1] + dy, C(k ? c : mix(c, '#f08ab0', .45))); px(s[0], s[1] - 1, C('#f2c230')); }
function lilypool(p) {
  const f = p.frame || 0, c = 3.5;
  cyl(c, c, 0, 3.4, .42, STONE, { t: lt(STONE, .16) });
  const s = PW(c, c, .36), rx = 3.02 * 16 * 1.414, ry = rx / 2;
  ellipse(s[0], s[1], rx + 2, ry + 1.5, STONE_D); ellipse(s[0], s[1], rx, ry, WATER[0], WATER[1]); ellipse(s[0] + 4, s[1] + 3, rx * .55, ry * .5, WATER[3], WATER[0]);
  for (let k = 0; k < 3; k++) { const q = ((f + k * 1.33) % 4) / 4; ring(s, 12 + q * 34, WATER[2], f + k, k === 0 ? 2 : 3); }
  const P = [[1.55, 2.3, 13, 1], [2.5, 5.0, 12, 1], [5.05, 1.75, 12, 1], [5.45, 4.7, 13, 1], [3.75, 5.75, 8, 1], [1.25, 4.0, 7, 0], [4.0, .95, 7, 0], [6.0, 3.2, 8, 1], [2.7, 1.2, 6, 0]];
  P.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1])); for (const q of P) pad(q[0], q[1], .37, q[2], q[3]);
  lotus(2.35, 3.55, .4); lotus(4.75, 3.0, .4, '#ffd8e8'); lotus(3.3, 4.85, .4);
  // fountain: stone baluster + bowl + jet
  cyl(c, c, .36, .42, .26, STONE); cyl(c, c, .62, .14, .5, STONE, { ol: false }); cyl(c, c, 1.1, .52, .1, lt(STONE, .08), { t: WATER[1] });
  for (let k = 0; k < 9; k++) { const a = k / 9 * 6.283 + .3; for (let q = 0; q < 6; q++) if ((q + k + f) % 3) dot(c + Math.cos(a) * .5, c + Math.sin(a) * .5, 1.1 - q * .12, q % 2 ? WATER[2] : '#e8fbff'); }
  for (let z = 1.2; z < 2.35; z += .0625) dot(c, c, z, ((Math.round(z * 16) + f) % 3) ? '#e8fbff' : WATER[2], ((Math.round(z * 16) + f) % 4 === 0) ? 1 : 0, 0);
  for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283 + f * .4; for (let i = 1; i <= 5; i++) { const t = i / 5; if ((i + f + k) % 2) dot(c + Math.cos(a) * .42 * t, c + Math.sin(a) * .42 * t, 2.35 + .15 * Math.sin(t * 3.14) - 1.15 * t * t, '#e8fbff'); } }
  const j = S2(c, c, 2.4); px(j[0], j[1], C('#ffffff')); px(j[0] - 1, j[1] + 1, C('#e8fbff')); px(j[0] + 1, j[1] + 1, C('#e8fbff'));
}
const fall = f => (u, v) => { const ph = (v + f * 2 + Math.floor(hash2(u, 1, 4) * 8)) % 8; return ph < 2 ? '#f4fdff' : ph < 5 ? '#a8e2ee' : '#78c8de'; };
function waterfall(p) {
  const f = p.frame || 0, rc = '#7d7a72', r = rng(17), top = (c) => (x, y) => { const k = hash2(Math.floor(x * 8), Math.floor(y * 8), 5); return k > .45 ? (k > .8 ? '#7fb85a' : MOSS) : c; };
  const crag = c => (u, v) => { const k = hash2(u >> 2, v >> 1, 3), q = hash2((u + v) >> 3, (v * 3 - u) >> 4, 8); return q < .09 ? dk(c, .4) : k < .14 ? dk(c, .16) : k > .88 ? lt(c, .16) : c; };
  const L = (x, y, z, w, d, h, c) => box(x, y, z, w, d, h, c, { l: crag(c), r: crag(dk(c, .22)), t: top(lt(c, .1)) });
  const bo = (x, y, z, s, i) => ball(x, y, z + s * .55, s, ['#86837a', '#75726a', '#918e84'][i % 3], { squash: .72, t: i % 2 ? '#6fa852' : undefined });
  L(0, 0, 0, 5, 2.5, 1.2, rc); L(.3, 0, 1.2, 4.3, 1.9, 1.3, '#86837a'); bo(.2, 1.7, 1.2, .42, 0); bo(4.75, 1.6, 1.2, .4, 1); L(.9, 0, 2.5, 3.2, 1.3, 1.2, '#75726a'); bo(.75, 1.0, 2.5, .44, 2); bo(4.25, 1.0, 2.5, .4, 3); bo(1.15, .5, 3.7, .36, 4); bo(3.85, .45, 3.7, .4, 5); bo(2.5, .2, 3.7, .3, 0);
  // water: top pool, three drops, two ledges
  qz(1.7, 3.3, .25, 1.3, 3.705, WATER[1], WATER[0]);
  qy(1.9, 3.1, 1.305, 2.5, 3.7, fall(f)); qz(1.8, 3.2, 1.3, 1.9, 2.505, WATER[1], WATER[2]);
  qy(1.7, 3.3, 1.905, 1.2, 2.5, fall(f + 1)); qz(1.6, 3.4, 1.9, 2.5, 1.205, WATER[1], WATER[2]);
  qy(1.5, 3.5, 2.505, 0, 1.2, fall(f + 2));
  for (const [x0, x1, y, z] of [[1.9, 3.1, 1.32, 2.52], [1.7, 3.3, 1.92, 1.22], [1.5, 3.5, 2.56, .02]]) for (let x = x0; x <= x1; x += .12) { const k = (Math.round(x * 8) + f) % 3; if (k) dot(x, y, z + (k - 1) * .06, '#ffffff', 0, -(k % 2)); }
  // ferns, moss tufts, vines
  for (const [x, y, z] of [[.6, 2.1, 1.2], [4.4, 2.0, 1.2], [.7, 1.5, 2.5], [4.2, 1.4, 2.5], [1.3, .9, 3.7], [3.7, .8, 3.7], [.4, .6, 1.2], [4.7, .7, 1.2]]) rosette(x, y, z, { n: 7, len: .5, rise: .28, droop: .4, lf: 2, r, cols: ['#2a6e44', '#3c9450', '#62bc68'] });
  for (const x of [.35, 1.1, 3.9, 4.6]) for (let q = 0; q < 7 + (x * 10) % 4; q++) dot(x, 2.5, 1.15 - q * .07, q % 2 ? '#4fa858' : '#3f8f50', q % 3 - 1, 0);
  for (const x of [.6, 4.1]) for (let q = 0; q < 6; q++) dot(x, 1.9, 2.45 - q * .07, q % 2 ? '#4fa858' : '#3f8f50', q % 3 - 1, 0);
  flower(1.0, 2.2, 1.3, '#f08ab0'); flower(4.0, 2.1, 1.32, '#f4f0e8'); flower(3.9, 1.6, 2.6, '#f2c230');
  bo(.25, 2.45, 0, .34, 1); bo(4.8, 2.4, 0, .36, 2); bo(1.2, 2.55, 0, .22, 3); bo(3.8, 2.6, 0, .2, 4);
}
const scx = y => 1 + .22 * Math.sin(y * 1.15 + .6);
function stream(p) {
  const L = p.len || 8, f = p.frame || 0, sl = p.slabs || [];
  qz(0, 2, 0, L, .01, (x, y) => { const dd = Math.abs(x - scx(y)); if (dd > .86) return null; if (dd > .6) { const k = hash2(Math.floor(x * 5), Math.floor(y * 5), 3); return k < .3 ? null : k < .6 ? '#a8a096' : k < .85 ? '#8f887e' : '#c8c0b0'; }
    if (dd > .5) return '#6ab8c0'; const w = Math.sin(y * 6 - f * 1.57 + x * 3) + Math.sin(y * 2.3 - f * 1.57 + x * 7); return w > 1.5 ? '#9fe2ea' : ((Math.floor(x * 8 + y * 8)) & 1) ? WATER[0] : WATER[1]; });
  const r = rng(L * 3); for (let i = 0; i < L * 1.2; i++) { const y = r() * L, sd = r() < .5 ? -1 : 1; ball(scx(y) + sd * (.7 + r() * .1), y, .08, .11 + r() * .08, ['#a8a096', '#8f887e', '#b8b0a2'][i % 3], { squash: .6, ol: false }); }
  for (const y of sl) { box(-.15, y, 0, 2.3, 1.2, .08, '#b8b0a2', { t: lt(STONE, .1) }); for (let x = .4; x < 2.1; x += .58) lw([x, y, .085], [x, y + 1.2, .085], STONE_D); }
}
function koipond(p) {
  const f = p.frame || 0, w = POND.w, d = POND.d, B = POND.bridge;
  qz(0, w, 0, d, .01, (x, y) => { const q = pondIn(x, y); if (q < -.3) return null; if (q < -.05) { const k = hash2(Math.floor(x * 5), Math.floor(y * 5), 7); return k < .22 ? null : k < .55 ? '#a8a096' : k < .8 ? '#8f887e' : '#c8c0b0'; }
    if (q < .1) return '#7cc4c4'; const bt = (x - B.x0) / (B.x1 - B.x0), sh = bt > 0 && bt < 1 && y > B.y0 && y < B.y1 + .15 + .5 * Math.sin(bt * Math.PI); const wv = Math.sin(x * 2.4 + y * 1.6 + f * 1.57) + Math.sin(x * .9 - y * 2.6 - f * 1.57);
    if (wv > 1.62 && !sh) return '#8fdce4'; const deep = q > .9; return sh ? '#256a80' : ((Math.floor(x * 8 + y * 8)) & 1) ? (deep ? '#2f8ca4' : WATER[0]) : (deep ? WATER[0] : WATER[1]); });
  const r = rng(31); for (let i = 0; i < 46; i++) { const a = i / 46 * 6.283 + r() * .08; let rad = 1.02; const x = w / 2 + Math.cos(a) * w / 2 * rad * (.93 + .06 * Math.sin(a * 3 + .6) + .035 * Math.cos(a * 5)), y = d / 2 + Math.sin(a) * d / 2 * rad * (.93 + .06 * Math.sin(a * 3 + .6) + .035 * Math.cos(a * 5)); if (x > B.x0 - .6 && x < B.x0 + .3 && y > B.y0 - .2 && y < B.y1 + .2) continue; if (x > B.x1 - .3 && x < B.x1 + .6 && y > B.y0 - .2 && y < B.y1 + .2) continue;
    if (i % 3 === 0) ball(x, y, .1, .14 + r() * .12, ['#a8a096', '#8f887e', '#b8b0a2'][i % 3], { squash: .65, t: i % 2 ? '#7fb85a' : undefined }); }
  for (const q of POND.pads) { pad(q[0], q[1], .02, 4, 0); pad(q[0] + .35, q[1] + .2, .02, 3, 0); } lotus(POND.pads[0][0], POND.pads[0][1], .04, '#ffd0e0'); lotus(POND.pads[3][0], POND.pads[3][1], .04); lotus(POND.pads[5][0] + .3, POND.pads[5][1] + .2, .04, '#ffd0e0');
}
function rail(L, h, y) {
  const NP = Math.round(L / 1.15); for (let i = 0; i <= NP; i++) { const x = i * L / NP, z = archZ(i / NP, h); for (const o of [0, .0625]) lw([Math.min(L - .07, x + o), y, z], [Math.min(L - .07, x + o), y, z + .78], o ? dk(RED, .2) : RED); dot(Math.min(L - .07, x), y, z + .84, GOLD); dot(Math.min(L - .07, x), y, z + .84, GOLD, 1, 0); }
  let a = null, b = null; for (let i = 0; i <= 28; i++) { const t = i / 28, q = S2(t * L, y, archZ(t, h) + .7), m = S2(t * L, y, archZ(t, h) + .36); if (a) { line(a, q, RED); line([a[0], a[1] + 1], [q[0], q[1] + 1], dk(RED, .25)); line(b, m, dk(RED, .12)); } a = q; b = m; }
}
function bridge(p) {
  const L = p.len || 9, D = 1.5, h = p.h || POND.bridge.h, N = 27;
  for (const t of [.28, .72]) for (const y of [.2, D - .2]) for (const o of [0, .0625]) lw([t * L + o, y, 0], [t * L + o, y, archZ(t, h)], '#5a2a24');
  rail(L, h, .12);
  for (let i = 0; i < N; i++) { const x0 = i * L / N, x1 = (i + 1) * L / N, z0 = archZ(i / N, h), z1 = archZ((i + 1) / N, h); fq([[x0, .12, z0], [x1, .12, z1], [x1, D - .1, z1], [x0, D - .1, z0]], i % 2 ? '#a8744a' : '#9a6840'); fq([[x0, D - .1, z0], [x1, D - .1, z1], [x1, D - .1, Math.max(0, z1 - .14)], [x0, D - .1, Math.max(0, z0 - .14)]], dk(RED, .28)); }
}
function bridgerail(p) { rail(p.len || 9, p.h || POND.bridge.h, .06); }

/* ---------- furniture ---------- */
function bench() {
  for (const x of [.04, 1.48]) { box(x, .1, 0, .08, .46, .4, IRON_D, { ol: false }); box(x, .06, .4, .08, .08, .56, IRON_D, { ol: false }); box(x, .1, .58, .08, .4, .05, IRON, { ol: false }); }
  box(.04, .06, .5, 1.52, .07, .44, WOOD, { l: PAT.siding(WOOD, 3), t: lt(WOOD, .2) }); box(.04, .12, .38, 1.52, .44, .07, WOOD, { t: PAT.fboards(lt(WOOD, .12), .11), l: dk(WOOD, .15) });
}
function plaque(p) {
  const c = p.c || GREEN; cyl(.25, .22, 0, .05, .5, IRON_D, { ol: false }); fq([[.02, .12, .78], [.48, .12, .78], [.48, .4, .6], [.02, .4, .6]], CREAM); fq([[.02, .12, .78], [.48, .12, .78], [.48, .19, .735], [.02, .19, .735]], c); fq([[.02, .4, .6], [.48, .4, .6], [.48, .4, .56], [.02, .4, .56]], dk(c, .2));
  for (let i = 0; i < 2; i++) lw([.08, .26 + i * .07, .69 - i * .045], [.42 - i * .1, .26 + i * .07, .69 - i * .045], '#7a6a5a'); dot(.4, .3, .68, '#4fa858'); dot(.4, .3, .68, '#4fa858', 1, -1);
}
function lamp() {
  cyl(.25, .25, 0, .14, .12, IRON_D); cyl(.25, .25, .12, .045, 2.0, IRON, { ol: false }); cyl(.25, .25, 1.1, .07, .06, IRON_L, { ol: false });
  box(.13, .13, 2.12, .24, .24, .34, '#f8f0d0', { l: '#f4e8b8', r: '#e8d8a0', t: IRON }); glow(() => box(.13, .13, 2.12, .24, .24, .34, '#fff0b0', { ol: false })); R.cone(.25, .25, 2.46, .22, .2, IRON_D); dot(.25, .25, 2.7, GOLD);
  lw([.13, .37, 2.12], [.13, .37, 2.46], IRON); lw([.37, .37, 2.12], [.37, .37, 2.46], IRON); lw([.37, .13, 2.12], [.37, .13, 2.46], IRON_D);
}
function lantern() { // stone toro
  cyl(.3, .3, 0, .24, .12, STONE_D); cyl(.3, .3, .12, .09, .5, STONE, { ol: false }); cyl(.3, .3, .62, .22, .08, STONE); box(.16, .16, .7, .28, .28, .3, lt(STONE, .1), { l: STONE, r: STONE_D });
  qy(.22, .38, .441, .76, .94, '#3a3440'); glow(() => { qy(.22, .38, .442, .76, .94, '#ffd98a'); qx(.441, .22, .38, .76, .94, '#f4c870'); }); qx(.441, .22, .38, .76, .94, '#3a3440');
  R.hip(.06, .06, 1.0, .48, .48, .26, STONE_D, { over: .06 }); ball(.3, .3, 1.32, .07, STONE);
}
function feeder() {
  cyl(.25, .25, 0, .12, .08, IRON_D); cyl(.25, .25, .08, .04, .55, IRON, { ol: false }); box(.11, .11, .62, .28, .28, .2, RED); qy(.2, .3, .391, .66, .74, '#2a2733'); dot(.34, .39, .7, GOLD);
  ball(.25, .25, .98, .17, '#d8eef4', { t: '#f4fcff', d: '#c89a5a' }); for (let i = 0; i < 9; i++) dot(.25, .25, .9, i % 2 ? '#b8743a' : '#d89a4a', (i % 5) - 2, (i % 3)); cyl(.25, .25, 1.12, .06, .04, RED, { ol: false });
}
function nectar() {
  cyl(.3, .3, 0, .13, .06, IRON_D); cyl(.3, .3, .06, .035, .62, IRON, { ol: false }); cyl(.3, .3, .68, .27, .05, '#e8e2d4', { t: '#f4f0e8' });
  for (const [dx, dy, c] of [[-.1, .02, '#f08a2a'], [.1, -.06, '#f4a03a'], [.02, .12, '#e8483b'], [-.02, -.12, '#f2c230']]) { blob(.3 + dx, .3 + dy, .74, 2.2, 1.3, c); dot(.3 + dx, .3 + dy, .75, lt(c, .5)); }
  lw([.3, .3, .73], [.3, .3, 1.0], '#4a9a50'); flower(.3, .3, 1.02, '#f08ab0', '#ffe070', true); flower(.38, .3, .92, '#b868e0', '#ffe070'); flower(.2, .3, .9, '#f2c230', '#e8483b');
}
function puparium() {
  box(0, 0, 0, 1.6, .5, 1.8, WOOD, { t: lt(WOOD, .2) }); qy(.1, 1.5, .501, .5, 1.68, '#2f4a40'); qy(.1, 1.5, .502, .5, 1.68, '#dff6f0', 'glass');
  for (const z of [1.55, 1.18, .82]) { lw([.14, .502, z], [1.46, .502, z], '#8a6a4a'); for (let x = .22; x < 1.45; x += .11) { const k = Math.round(x * 100 + z * 10) % 5; if (k === 4) continue; dot(x, .502, z - .04, '#6a8a4a'); dot(x, .502, z - .09, ['#7fc060', '#c8b050', '#5aa868', '#e8d070'][k]); dot(x, .502, z - .14, ['#5a9a48', '#a89040', '#4a8858', '#c8b050'][k]); } }
  for (const [x, z, c] of [[.5, 1.0, '#f08a2a'], [1.2, 1.36, '#4a8ae8']]) { dot(x, .503, z, '#2a2733'); dot(x, .503, z, c, -1, -1); dot(x, .503, z, c, 1, -1); dot(x, .503, z, c, -2, -1); dot(x, .503, z, c, 2, -1); dot(x, .503, z, dk(c, .2), -1, 0); dot(x, .503, z, dk(c, .2), 1, 0); }
  signY('PUPAE', .1, 1.5, .503, .14, .4, GREEN, CREAM);
}
function sketchboard(p) {
  const n = Math.min(8, p.n || 0); for (const x of [.1, 2.0]) box(x, .1, 0, .08, .08, 1.7, WOOD, { ol: false });
  box(0, .08, .55, 2.2, .1, 1.1, '#8a6a4a'); qy(.06, 2.14, .181, .6, 1.42, '#d8b888'); signY('SKETCHES', .06, 2.14, .182, 1.44, 1.62, GREEN, CREAM, { frame: false });
  for (let i = 0; i < n; i++) { const x = .16 + (i % 4) * .5, z = i < 4 ? 1.02 : .64; qy(x, x + .32, .183, z, z + .34, i % 3 === 1 ? '#f4ecd8' : '#fbf8f0'); dot(x + .16, .183, z + .34, RED); const cs = ['#d858b8', '#4fa858', '#f08a2a', '#4a8ae8'][i % 4]; dot(x + .15, .183, z + .2, cs); dot(x + .15, .183, z + .2, cs, 1, 0); dot(x + .15, .183, z + .2, cs, 0, -1); dot(x + .15, .183, z + .2, '#4a4a58', 0, 1); dot(x + .15, .183, z + .2, '#4a4a58', 0, 2); dot(x + .15, .183, z + .2, '#4fa858', 1, 2); }
  if (!n) textY('PIN ONE', .3, .183, 1.1, '#8a6a4a');
}
function sketchspot() {
  // easel with a pad (north side), folding stool
  for (const [x0, x1] of [[.5, .42], [.86, .94]]) lw([x0 + .0, .12, 1.15], [x1, .2, 0], WOOD); lw([.68, .12, 1.15], [.68, 0, 0], dk(WOOD, .2));
  box(.44, .14, .5, .5, .05, .6, '#fbf8f0', { l: '#fbf8f0', r: '#e8e2d4' }); box(.42, .13, .46, .54, .1, .05, WOOD, { ol: false }); for (let i = 0; i < 3; i++) lw([.5, .191, .98 - i * .12], [.86 - i * .08, .191, .98 - i * .12], '#b8b0c8'); dot(.68, .191, .76, '#d858b8'); dot(.68, .191, .76, '#d858b8', 1, 0); dot(.68, .191, .7, '#4fa858');
  for (const [x, y] of [[.12, .5], [.42, .5], [.12, .78], [.42, .78]]) lw([x, y, 0], [x + (x < .3 ? .06 : -.06), y, .38], IRON_D); box(.08, .46, .38, .4, .38, .05, '#c8402f', { t: '#d8583f' });
}
function seedtable(p) {
  const r = rng(p.seed || 4);
  for (const [x, y] of [[.06, .06], [1.86, .06], [.06, .66], [1.86, .66]]) box(x, y, 0, .08, .08, .5, dk(WOOD, .15), { ol: false });
  box(0, 0, .5, 2, .8, .07, WOOD, { t: PAT.fboards(lt(WOOD, .15), .2) }); box(0, 0, .57, 2, .36, .28, WOOD, { t: PAT.fboards(lt(WOOD, .15), .18), l: dk(WOOD, .1) });
  const pot = (x, y, z, k) => { cyl(x, y, z, .075, .12, '#c9764a', { ol: false, t: '#4a3626' }); if (k === 0) { lw([x, y, z + .12], [x, y, z + .3], '#4a9a50'); dot(x, y, z + .32, '#d858b8'); dot(x, y, z + .32, '#f2c8e8', 1, 0); } else if (k === 1) { for (const dx of [-2, 0, 2]) dot(x, y, z + .2, '#58b868', dx, -Math.abs(dx)); dot(x, y, z + .16, '#3f9a55'); dot(x, y, z + .26, '#58b868'); } else if (k === 2) { blob(x, y, z + .17, 1.6, 1.4, '#4f9a62'); dot(x, y, z + .22, '#e8c83a'); } else if (k === 3) { dot(x, y, z + .18, '#7fc060'); dot(x, y, z + .18, '#d8483b', 1, -1); dot(x, y, z + .18, '#7fc060', -1, -1); } else { blob(x, y, z + .19, 2.2, 1.4, '#3c9450'); dot(x, y, z + .2, '#62bc68'); } };
  for (let x = .16; x < 1.9; x += .22) pot(x, .18, .85, Math.floor(r() * 5)); for (let x = .16; x < 1.9; x += .22) pot(x, .58, .57, Math.floor(r() * 5));
  signY('SEEDS', .3, 1.7, .801, .12, .4, CREAM, GREEN);
}
function counter(p) {
  const w = p.w || 3, k = p.kind || 'gift', nm = p.name || { gift: 'GIFTS', cafe: 'CAFE', ticket: 'TICKETS' }[k];
  box(0, 0, 0, w, .6, 1, GREEN, { t: '#e8dcc0' }); for (let x = .1; x < w - .3; x += .7) qy(x, Math.min(w - .1, x + .6), .601, .12, .5, dk(GREEN, .12));
  signY(nm, .15, w - .15, .602, .58, .88, CREAM, GREEN); qy(0, w, .601, 0, .08, dk(GREEN, .3));
  if (k === 'gift') { box(.25, .1, 1, .4, .34, .24, '#3a3440'); lit(() => qy(.3, .6, .441, 1.1, 1.2, '#7df0a0')); at(w - .7, .05, 1, () => { cyl(.25, .25, 0, .1, .14, '#c9764a', { t: '#4a3626' }); rosette(.25, .25, .14, { n: 7, len: .32, rise: .3, droop: .25, lf: 1, r: rng(3) }); }); for (let i = 0; i < 3; i++) box(1.1 + i * .2, .2, 1, .16, .22, .04 + i * .03, ['#d858b8', '#4a8ae8', '#f2c230'][i], { ol: false }); }
  else if (k === 'cafe') { box(.2, .08, 1, .55, .4, .42, '#c8ccd4'); qy(.26, .7, .481, 1.06, 1.3, '#3a3440'); lit(() => dot(.66, .481, 1.36, '#ff7a5a')); cyl(w - .55, .3, 1, .22, .04, '#f4f0e8'); ball(w - .55, .3, 1.14, .15, '#f4c8d8', { squash: .7, ol: false }); const s = PW(w - .55, .3, 1.16); ellipse(s[0], s[1], 5.5, 4.5, '#f4fcff', 'glass'); for (let i = 0; i < 3; i++) cyl(1.2 + i * .2, .3, 1, .06, .12, '#f4f0e8', { ol: false }); }
  else { box(.25, .15, 1, .3, .3, .22, '#3a3440'); lit(() => qy(.28, .52, .451, 1.05, 1.18, '#7df0a0')); for (let i = 0; i < 4; i++) box(w - 1.1 + i * .2, .15, 1, .16, .28, .03, ['#4fa858', '#f08a2a', '#4a8ae8', '#f4f0e8'][i], { ol: false }); cyl(w / 2, .3, 1, .03, .3, IRON, { ol: false }); signY('TOURS', w / 2 - .75, w / 2 + .75, .32, 1.26, 1.5, CREAM, RED); }
}
function shelf(p) {
  const w = p.w || 3, k = p.kind || 'gift', r = rng((p.seed || 2) + w), nm0 = p.name || (k === 'cafe' ? 'GLASSHOUSE CAFE' : 'GARDEN GIFTS'), nm = R.textW(nm0) > (w - .2) * 16 ? (k === 'cafe' ? 'CAFE' : 'GIFTS') : nm0;
  box(0, 0, 0, w, .45, 2.3, '#7a5a3a', { t: '#8a6a44' }); qy(.08, w - .08, .451, .1, 1.9, '#5a4028'); signY(nm, .08, w - .08, .452, 1.94, 2.24, GREEN, CREAM);
  if (k === 'cafe') { qy(.15, w - .15, .452, 1.15, 1.85, '#2a2f38'); textY('TEA  CAKE', .3, .453, 1.75, '#f4ead0'); for (let i = 0; i < 4; i++) lw([.3, .453, 1.55 - i * .1], [Math.min(w - .3, .3 + 1.2 + (i % 2) * .5), .453, 1.55 - i * .1], i % 2 ? '#e8c06a' : '#b8c0cc'); if (w > 2.4) { dot(w - .5, .453, 1.5, '#f08ab0'); dot(w - .5, .453, 1.5, '#f08ab0', 1, 0); dot(w - .5, .453, 1.5, '#4fa858', 0, 1); dot(w - .5, .453, 1.5, '#4fa858', 0, 2); }
    for (const z of [.72, .3]) { qy(.08, w - .08, .46, z, z + .04, '#a8845a'); for (let x = .2; x < w - .2; x += .19) { const q = Math.floor(r() * 4); if (q < 2) { qy(x, x + .1, .46, z + .04, z + .16, '#f4f0e8'); } else if (q === 2) { qy(x, x + .11, .46, z + .04, z + .24, ['#c9a26a', '#8a5a3a', '#d8b888'][Math.floor(r() * 3)]); dot(x + .05, .46, z + .26, '#3a3440'); } else qy(x, x + .12, .46, z + .04, z + .12, '#c8402f'); } } }
  else for (const z of [1.5, 1.08, .66, .24]) { qy(.08, w - .08, .46, z, z + .04, '#a8845a'); for (let x = .18; x < w - .25; x += .24) { const q = Math.floor(r() * 6); if (q === 0) { qy(x, x + .12, .46, z + .04, z + .14, '#c9764a'); dot(x + .06, .46, z + .2, '#58b868'); dot(x + .06, .46, z + .2, '#58b868', 1, -1); dot(x + .06, .46, z + .2, '#3f9a55', -1, -1); dot(x + .06, .46, z + .26, '#d858b8'); } else if (q === 1) { qy(x, x + .08, .46, z + .04, z + .28, ['#4a8ae8', '#d9483b', '#4fa858', '#e8b83a'][Math.floor(r() * 4)]); qy(x + .09, x + .16, .46, z + .04, z + .25, '#f4ead0'); } else if (q === 2) { qy(x, x + .16, .46, z + .06, z + .16, '#f08a2a'); dot(x + .16, .46, z + .13, '#f4f0e8', 1, 0); dot(x, .46, z + .1, '#f4f0e8', -1, 0); dot(x + .04, .46, z + .14, '#2a2733'); } else if (q === 3) { qy(x + .02, x + .13, .46, z + .04, z + .2, '#e8b040'); qy(x + .02, x + .13, .46, z + .2, z + .23, '#f4f0e8'); } else if (q === 4) { qy(x, x + .14, .46, z + .04, z + .22, '#fbf8f0'); dot(x + .07, .46, z + .14, ['#f08a2a', '#4a8ae8', '#d858b8'][Math.floor(r() * 3)]); dot(x + .07, .46, z + .14, '#2a2733', 0, 1); } else { qy(x, x + .13, .46, z + .04, z + .13, '#5a8a6a'); dot(x + .06, .46, z + .16, '#f2c230'); } } }
}
function banner(p) {
  const s = p.season === undefined ? 0 : p.season, t = ['TULIP TIME', 'SUNFLOWER DAYS', 'GOLDEN MUMS', 'WINTER LIGHTS'][s], c = ['#d86a8f', '#e8a81a', '#b8562a', '#b8242e'][s];
  for (const x of [0, 3.9]) { box(x, .05, 0, .1, .1, 2.4, IRON, { ol: false }); dot(x + .05, .1, 2.46, GOLD); } qy(.1, 3.9, .1, 1.5, 2.3, c); qy(.1, 3.9, .101, 2.22, 2.3, GOLD); qy(.1, 3.9, .101, 1.5, 1.56, GOLD);
  const tw = R.textW(t) / 16; textY(t, 2 - tw / 2, .102, 2.17, CREAM); textY('FLOWER SHOW', 2 - R.textW('FLOWER SHOW') / 32, .102, 1.72, lt(c, .6));
  if (s === 3) lit(() => { for (let x = .15; x < 3.9; x += .22) dot(x, .102, 1.48, ['#ffe070', '#7ad8ff', '#ff7a6a'][Math.round(x / .22) % 3], 0, 1); });
}
function mister(p) {
  const w = p.w || 4, f = p.frame || 0; lw([0, .05, .28], [w, .05, .28], '#8e98a8'); lw([0, .05, .26], [w, .05, .26], '#5a6472');
  for (let x = .5; x < w; x += 1) { dot(x, .05, .22, '#c9a25a'); dot(x, .05, .18, '#c9a25a'); for (let q = 1; q <= 6; q++) for (let d = -q; d <= q; d++) if (((d + q + f + Math.round(x)) % 3) === 0 && (d + q + f) % 2 === 0) dot(x, .05, .16 - q * .045, '#e8fbff', Math.round(d * .6), 0); }
}
function mapboard() {
  for (const x of [.12, 1.42]) box(x, .1, 0, .08, .08, 1.5, IRON, { ol: false }); box(0, .08, .55, 1.6, .1, 1, IRON_D); qy(.06, 1.54, .181, .6, 1.5, CREAM);
  const Z = [[.1, .5, 1.2, 1.44, '#7a9a8a'], [.5, 1.1, 1.2, 1.44, '#4fa858'], [1.1, 1.5, 1.2, 1.44, '#e2d0a0'], [.1, .5, .95, 1.2, '#f2c8e8'], [.5, 1.1, .95, 1.2, '#48a9c0'], [1.1, 1.5, .95, 1.2, '#3a9ab0'], [.1, .5, .66, .95, '#c9a26a'], [1.1, 1.5, .66, .95, '#f08ab0']];
  for (const [x0, x1, z0, z1, c] of Z) qy(x0, x1, .182, z0, z1, c); lit(() => { dot(.8, .183, .78, '#e8483b'); dot(.8, .183, .78, '#e8483b', 1, 0); dot(.8, .183, .78, '#e8483b', 0, -1); dot(.8, .183, .78, '#e8483b', 1, -1); }); 
}
function barrow() {
  box(.1, .1, .28, .8, .5, .3, '#4a8a6a', { t: SOIL }); cyl(1.02, .35, 0, .16, .08, '#3a3440'); lw([.1, .15, .5], [-.25, .15, .62], WOOD); lw([.1, .55, .5], [-.25, .55, .62], WOOD); lw([.2, .2, 0], [.2, .2, .28], IRON_D); lw([.2, .5, 0], [.2, .5, .28], IRON_D);
  at(.3, .2, .58, () => rosette(.2, .15, 0, { n: 6, len: .3, rise: .3, droop: .2, lf: 1, r: rng(2) })); cyl(.72, .35, .58, .09, .14, '#c9764a', { t: '#4a3626' }); dot(.72, .35, .8, '#f08ab0'); dot(.72, .35, .8, '#f08ab0', 1, 0); dot(.72, .35, .76, '#4fa858');
  // watering can on the floor
  cyl(1.3, .7, 0, .13, .26, '#5a9ab8'); lw([1.43, .7, .2], [1.62, .7, .34], '#5a9ab8'); lw([1.3, .58, .26], [1.3, .82, .34], '#4a7a98'); dot(1.62, .7, .36, '#8ac0d8');
}

const T = ['conservatory', 'cons'];
const A = (id, tags, size, draw, x) => Object.assign({ id: 'furn.cons.' + id, kind: 'furniture', tags: T.concat(tags), size, draw, variants: [{}] }, x);
export default [
  A('glasswall', ['wall', 'window'], p => [p.w || 4, .12, 5.2], glasswall, { wall: true, mount: 0, solid: false, vb: p => [0, 0, 0, p.w || 4, 1.6, 5.3], variants: [{ w: 8, time: 'day', season: 1 }, { w: 8, time: 'dusk', season: 2, u0: 9 }, { w: 8, time: 'night', season: 0, u0: 20 }, { w: 8, time: 'day', season: 3, u0: 30 }, { w: 4, time: 'day', season: 0, wx: 'rain' }] }),
  A('partition', ['screen'], p => [p.w || 4, .2, 2.5], partition, { variants: [{ w: 4 }, { w: 2 }] }),
  A('arch', ['archway'], p => [p.w || 2, .3, 3.2], arch, { solid: false, variants: [{ name: 'PALM HOUSE' }, { w: 3, name: 'DESERT HOUSE' }] }),
  A('gate', ['cons_gate'], p => [p.w || 3.5, .3, 1.2], gate, { solid: false, vb: p => [-.1, -1, 0, (p.w || 3.5) + .1, .5, 1.4], variants: [{}, { open: 1 }] }),
  A('shaft', ['light'], [5, 5, .02], shaft, { flat: true, solid: false }),
  A('lilypool', ['water_feature', 'fountain', 'cons_pool'], [7, 7, .5], lilypool, { frames: 4, vb: [-.2, -.2, 0, 7.2, 7.2, 2.6], variants: [{ frame: 0 }, { frame: 2 }] }),
  A('waterfall', ['water_feature', 'cons_waterfall'], [5, 2.5, 3.7], waterfall, { frames: 4, vb: [-.4, -.2, 0, 5.4, 3, 4.4], variants: [{ frame: 0 }, { frame: 1 }] }),
  A('stream', ['water_feature'], p => [2, p.len || 8, .05], stream, { frames: 4, flat: true, solid: false, vb: p => [-.3, -.1, 0, 2.3, (p.len || 8) + .1, .4], variants: [{ len: 8, slabs: [3] }, { len: 5, frame: 2 }] }),
  A('koipond', ['water_feature', 'pond'], [POND.w, POND.d, .05], koipond, { frames: 4, flat: true, solid: false, vb: [-.4, -.4, 0, POND.w + .4, POND.d + .4, .5], variants: [{ frame: 0 }] }),
  A('bridge', ['bridge'], p => [p.len || 9, 1.5, .05], bridge, { flat: true, solid: false, vb: p => [-.1, -.1, 0, (p.len || 9) + .1, 1.6, 1.7] }),
  A('bridgerail', ['bridge'], p => [p.len || 9, .12, 1.5], bridgerail, { solid: false, vb: p => [-.1, -.1, 0, (p.len || 9) + .1, .3, 1.7] }),
  A('bench', ['cons_bench'], [1.6, .6, .95], bench, { seats: [{ x: .45, y: .36, z: .45, dir: 1 }, { x: 1.15, y: .36, z: .45, dir: 1 }], use: { x: .8, y: .95 } }),
  A('plaque', ['cons_plaque'], [.5, .5, .8], plaque, { solid: false, use: { x: .25, y: .85 }, variants: [{}, { c: '#b8562a' }] }),
  A('lamp', ['lamp'], [.5, .5, 2.7], lamp, { light: { x: .25, y: .25, z: 0, r: 3.4 } }),
  A('lantern', ['lamp'], [.6, .6, 1.4], lantern, { light: { x: .3, y: .5, z: 0, r: 2.2 } }),
  A('feeder', ['cons_koifeed'], [.5, .5, 1.2], feeder, { use: { x: .25, y: .9 } }),
  A('nectar', ['cons_bfly'], [.6, .6, 1.1], nectar, { use: { x: .3, y: 1.1 } }),
  A('puparium', ['cons_plaque'], [1.6, .5, 1.8], puparium, { use: { x: .8, y: 1 } }),
  A('sketchboard', ['cons_board'], [2.2, .3, 1.7], sketchboard, { use: { x: 1.1, y: .8 }, variants: [{ n: 0 }, { n: 5 }] }),
  A('sketchspot', ['cons_sketch'], [1, .9, 1.2], sketchspot, { seats: [{ x: .28, y: .65, z: .42, dir: 3 }], use: { x: .28, y: 1.3 } }),
  A('seedtable', ['cons_seedling'], [2, .8, 1.1], seedtable, { use: { x: 1, y: 1.25 }, variants: [{ seed: 4 }, { seed: 9 }] }),
  A('counter', ['counter'], p => [p.w || 3, .6, 1.05], counter, { use: p => ({ x: (p.w || 3) / 2, y: 1.1 }), staff: p => ({ x: (p.w || 3) / 2, y: -.45, dir: 1 }), vb: p => [-.1, -.1, 0, (p.w || 3) + .1, .8, 1.7], variants: [{ kind: 'gift' }, { kind: 'cafe' }, { kind: 'ticket', w: 2.5 }] }),
  A('shelf', ['shelf_unit'], p => [p.w || 3, .45, 2.3], shelf, { variants: [{ kind: 'gift' }, { kind: 'cafe' }] }),
  A('banner', ['flowershow'], [4, .2, 2.5], banner, { solid: false, variants: [{ season: 0 }, { season: 1 }, { season: 2 }, { season: 3 }] }),
  A('mister', ['mist'], p => [p.w || 4, .1, .3], mister, { frames: 2, overhead: true, solid: false, variants: [{}, { frame: 1 }] }),
  A('mapboard', ['cons_map'], [1.6, .3, 1.6], mapboard, { use: { x: .8, y: .8 } }),
  A('barrow', ['decor'], [1.2, .7, .7], barrow, { vb: [-.4, -.1, 0, 1.8, 1, 1.1] }),
];
