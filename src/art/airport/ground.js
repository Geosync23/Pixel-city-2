// Apron service vehicles. All lie along x; p.dir = 1 drives toward +x, -1 toward -x.
import { box, qy, qx, qz, lw, fq, lit, glow, dk, lt, rng, winY, winX, PAT, spx, at } from '../../engine/raster.js';
import { AP, SNOW, winter, wtext, tw, bsignY, along, lamp, loft, tubeSecs, wheel, bmp, LEAF } from './_lib.js';

const BAGC = ['#d8483a', '#3f7fc4', '#2f8f8a', '#f2c230', '#8c2f4a', '#55627a', '#f08a2c', '#3d4654', '#7a5a3c', '#c93f7a'];
/** head lights (front) or tail lights (rear) on the visible +x end plane */
function endLights(A, L, wd, z, front) {
  if (A.f === front) { const c = front ? '#fff6d0' : '#ff4a3a'; for (const y of [.22, wd - .22]) { lit(() => { spx(L, y, z, 0, 0, c); spx(L, y, z, 0, -1, c); }); if (front) glow(() => { spx(L, y, z, 1, 0, '#fff2c4'); spx(L, y, z, -1, 0, '#fff2c4'); spx(L, y, z, 0, 1, '#fff2c4'); spx(L, y, z, 0, -2, '#fff2c4'); }); } }
  // near-side marker on the +y flank
  const xe = A.X(front ? L - .06 : .06); lit(() => spx(xe, wd, z, 0, 0, front ? '#ffb84a' : '#ff4a3a'));
}
function lights(A, L, wd, z) { endLights(A, L, wd, z, true); endLights(A, L, wd, z, false); }
/** truck cab occupying x0..x0+len (vehicle coords, front = high x) */
function cab(A, L, x0, len, wd, h, c) {
  A.B(x0, 0, .3, len, wd, h - .3, c);
  A.WY(x0 + len * .3, x0 + len - .12, wd, .3 + (h - .3) * .48, h - .12, { on: false, glass: ['#34425a', '#465a78'], frame: dk(c, .5) });
  A.QY(x0 + len * .3, x0 + len * .3 + .06, wd, .45, .3 + (h - .3) * .48, dk(c, .3));
  if (A.f) { winX(L, .12, wd - .12, .3 + (h - .3) * .48, h - .12, { on: false, glass: ['#2b3a52', '#3d506e'], frame: dk(c, .55) }); qx(L, .1, wd - .1, .3, .5, '#3d4654'); }
}
const beacon = (A, x, y, z) => lamp(A.X(x), y, z, '#ffb84a');

function tug(p, L = 2.2) {
  const A = along(p.dir, L), wd = 1.2, c = p.col || '#f4f2ea', acc = p.accent || AP.red;
  A.W(.5, wd, 0, .26); A.W(1.7, wd, 0, .26);
  A.B(0, 0, .22, L, wd, .5, c); A.QY(0, L, wd, .3, .42, acc); A.B(1.3, .05, .72, .9, wd - .1, .22, c);
  A.B(.25, .15, .72, .7, wd - .3, .1, '#3d4654'); A.B(.2, .15, .72, .12, wd - .3, .55, '#3d4654');   // seat
  lw(A.P(1.25, wd - .2, .9), A.P(1.05, wd - .2, 1.25), '#3d4654');                                    // steering column
  for (const [x, y] of [[.1, .08], [.1, wd - .08], [1.25, .08], [1.25, wd - .08]]) lw(A.P(x, y, .72), A.P(x, y, 1.75), '#55627a');
  A.B(0, 0, 1.75, 1.4, wd, .08, winter() ? SNOW : acc);
  lights(A, L, wd, .5); beacon(A, .7, wd / 2, 1.9);
}
function cart(p, L = 2.6, seed = 1) {
  const A = along(p.dir, L), wd = 1.3, r = rng(seed * 7 + 3), cov = p.cover || '#3f7fc4';
  A.W(.5, wd, 0, .2); A.W(2.0, wd, 0, .2);
  A.B(.1, 0, .3, 2.3, wd, .14, '#8a93a0'); lw(A.P(2.4, wd / 2, .35), A.P(2.75, wd / 2, .3), '#3d4654');
  for (const [x, y] of [[.15, .05], [2.3, .05]]) lw(A.P(x, y, .44), A.P(x, y, 1.6), '#55627a');
  // bags (back row then front row)
  for (const y0 of [.08, .68]) { let x = .2; while (x < 2.0) { const bw = .45 + r() * .4, bh = .35 + r() * .45, c = BAGC[Math.floor(r() * BAGC.length)]; if (r() < (p.load === undefined ? .85 : p.load)) { A.B(x, y0, .44, Math.min(bw, 2.3 - x), .52, bh, c); if (r() < .5 && bh < .6) A.B(x + .05, y0 + .05, .44 + bh, Math.min(bw, 2.3 - x) - .1, .4, .25, BAGC[Math.floor(r() * BAGC.length)]); } x += bw + .04; } }
  for (const [x, y] of [[.15, wd - .05], [2.3, wd - .05]]) lw(A.P(x, y, .44), A.P(x, y, 1.6), '#55627a');
  A.B(.05, -.02, 1.6, 2.4, wd + .04, .08, winter() ? SNOW : cov); A.QY(.05, 2.45, wd + .02, 1.38, 1.6, cov, 'glass');
  lit(() => spx(A.X(.12), wd, .4, 0, 0, '#ff4a3a'));
}
function train(p) {
  const n = p.carts === undefined ? 3 : p.carts, L = 2.2 + n * 3.0, f = p.dir !== -1, parts = [];
  for (let i = 0; i < n; i++) parts.push([f ? i * 3.0 + .2 : 2.2 + .2 + (n - 1 - i) * 3.0, () => cart(p, 2.6, (p.seed || 1) + i)]);
  parts.push([f ? L - 2.2 : 0, () => tug(p)]); parts.sort((a, b) => a[0] - b[0]);
  for (const [x, fn] of parts) at(x, 0, 0, fn);
}
function pushback(p) {
  const L = 3.6, A = along(p.dir, L), wd = 1.9, c = p.col || '#f2c230';
  A.W(.7, wd, 0, .38); A.W(2.8, wd, 0, .38);
  A.B(0, 0, .3, L, wd, .55, c); A.QY(0, L, wd, .3, .45, PAT.vstripes('#2a2f3d', c, 3)); A.QZ(.15, 1.5, .15, wd - .15, .86, dk(c, .15));
  A.B(1.9, .1, .85, 1.1, 1.0, .75, '#f4f2ea'); A.WY(2.0, 2.9, 1.1, 1.05, 1.5, { on: false, glass: ['#34425a', '#465a78'] });
  if (A.f) winX(3.0, .2, 1.0, 1.05, 1.5, { on: false, glass: ['#2b3a52', '#3d506e'] }); else winX(L - 3.0 + 1.1 - 1.1 + 1.1, .2, 1.0, 1.05, 1.5, { on: false, glass: ['#2b3a52', '#3d506e'] });
  if (winter()) A.QZ(1.95, 2.95, .15, 1.05, 1.61, SNOW);
  lw(A.P(L, wd / 2, .4), A.P(L + .5, wd / 2, .35), '#3d4654'); wtext('y', 'TUG', A.f ? .5 : L - .5 - tw('TUG') / 16, wd + .01, .8, '#2a2f3d');
  lights(A, L, wd, .62); beacon(A, 2.4, .6, 1.72);
}
function fuelTruck(p) {
  const L = 6.4, A = along(p.dir, L), wd = 1.8, c = p.col || '#f4f2ea', acc = p.accent || AP.red, name = p.name || 'JET A-1';
  for (const x of [.9, 1.7, 5.4]) A.W(x, wd, 0, .36);
  A.B(0, .1, .35, L, wd - .2, .3, '#3d4654');
  // tank (lofted cylinder)
  const st = [[.25, .55], [.5, .82], [4.2, .82], [4.45, .55]].map(q => ({ x: q[0], y: wd / 2, z: 1.45, ry: q[1], rz: q[1] * .95 })).sort((a, b) => (A.f ? 1 : -1) * (a.x - b.x));
  loft(tubeSecs(st, 14, A.P), { closed: true, col: (k, i) => { const u = (st[i].x + st[i + 1].x) / 2; return winter() && k >= 2 && k <= 4 ? SNOW : u > 1.6 && u < 2.2 ? acc : k === 13 ? acc : c; }, cap: dk(c, .3) });
  wtext('y', name, A.f ? 2.4 : L - 2.4 - tw(name) / 16, wd / 2 + .8, 1.75, '#3d4654');
  A.B(.2, .15, .65, .5, wd - .3, .1, '#8a93a0'); lw(A.P(1.2, wd / 2 + .5, 2.2), A.P(3.8, wd / 2 + .5, 2.2), '#8a93a0');
  { const m = A.P(3.6, wd / 2 + .82, 1.2); for (const [a, b] of [[0, -2], [-1, -1], [0, -1], [1, -1], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [-1, 1], [0, 1], [1, 1], [0, 2]]) spx(m[0], m[1], m[2], a, b, a === 0 && b === 0 ? '#2a2f3d' : '#f2c230'); }
  A.B(4.55, .15, .65, .25, wd - .3, 1.3, '#8a93a0');
  cab(A, L, 4.8, 1.6, wd, 2.15, c); A.QY(4.8, 6.4, wd, .62, .78, acc);
  if (winter()) A.QZ(4.85, 6.35, .05, wd - .05, 2.16, SNOW);
  lights(A, L, wd, .7); beacon(A, 5.5, wd / 2, 2.3);
}
function catering(p) {
  const L = 5.6, A = along(p.dir, L), wd = 1.8, c = p.col || '#f4f2ea', acc = p.accent || '#2f8f8a', up = (p.up === undefined ? 0 : p.up) * 1.5, name = p.name || 'SKY CHEF';
  for (const x of [1.0, 4.7]) A.W(x, wd, 0, .36);
  A.B(0, .1, .35, L, wd - .2, .3, '#3d4654');
  if (up > .1) { for (const y of [.2, wd - .2]) { lw(A.P(.4, y, .65), A.P(3.4, y, .65 + up), '#8a93a0'); lw(A.P(3.4, y, .65), A.P(.4, y, .65 + up), '#8a93a0'); } for (const x of [.4, 3.4]) for (const y of [.3, wd - .3]) lw(A.P(x, y, .3), A.P(x, y, .05), '#55627a'); }
  const z = .65 + up;
  A.B(.1, 0, z, 3.6, wd, 1.9, c, { t: winter() ? SNOW : undefined }); A.QY(.1, 3.7, wd, z, z + .4, acc); A.QY(.1, 3.7, wd, z + .5, z + .58, '#f2c230');
  wtext('y', name, A.f ? .5 : L - .5 - tw(name) / 16, wd + .01, z + 1.45, acc); bmp('y', ['.###.', '#####', '#####', '.###.', '..#..', '..#..', '..#..'], A.f ? 2.9 : L - 3.2, wd + .01, z + 1.5, { '#': '#f08a2c' });
  if (!A.f) { qx(L, .15, wd - .15, z + .1, z + 1.75, PAT.siding('#dfe3e6', 3)); lw([L, wd / 2, z + .1], [L, wd / 2, z + 1.75], '#8a93a0'); }
  else if (up > .1) { box(3.7, .2, z, .8, wd - .4, .08, '#8a93a0'); lw([4.5, .2, z + .08], [4.5, .2, z + .9], '#55627a'); lw([4.5, wd - .2, z + .08], [4.5, wd - .2, z + .9], '#55627a'); lw([3.7, wd - .2, z + .9], [4.5, wd - .2, z + .9], '#55627a'); }
  cab(A, L, 4.0, 1.6, wd, 2.0, c); A.QY(4.0, 5.6, wd, .62, .78, acc);
  if (winter()) A.QZ(4.05, 5.55, .05, wd - .05, 2.01, SNOW);
  lights(A, L, wd, .7); beacon(A, 4.8, wd / 2, 2.15);
}
function stairs(p) {
  const L = 5.2, A = along(p.dir, L), wd = 1.6, c = p.col || '#f4f2ea', acc = p.accent || AP.navy, top = p.top || 2.7;
  for (const x of [.8, 4.3]) A.W(x, wd, 0, .32);
  A.B(0, .1, .3, L, wd - .2, .3, '#3d4654');
  cab(A, L, 3.7, 1.5, wd, 1.6, c);
  // far stringer, treads, near stringer (stairs run x0..4.0, rising toward the front)
  const x0 = 1.5, zs = x => .55 + (x - x0) / (4 - x0) * (top - .55);
  fq([A.P(x0, .12, zs(x0) - .25), A.P(4.0, .12, top - .3), A.P(4.0, .12, top + .9), A.P(x0, .12, zs(x0) + .9)], dk(c, .42));
  const n = 9; for (let i = 0; i < n; i++) { const xa = x0 + i * (4 - x0) / n, xb = xa + (4 - x0) / n, z = zs(xb); A.QZ(xa, xb, .15, wd - .15, z, i % 2 ? '#aab4c0' : '#d3dae2'); A.QY(xa, xb, wd - .15, z - .2, z, '#7c8792'); }
  A.B(3.9, .1, top - .12, 1.2, wd - .2, .12, '#aab4c0'); if (winter()) A.QZ(3.95, 5.05, .15, wd - .15, top + .01, SNOW, 'glass');
  fq([A.P(x0, wd - .1, zs(x0) - .25), A.P(4.0, wd - .1, top - .3), A.P(4.0, wd - .1, top + .05), A.P(x0, wd - .1, zs(x0) + .1)], dk(c, .18));
  lw(A.P(x0, wd - .1, zs(x0) + .1), A.P(4.0, wd - .1, top + .05), acc); lw(A.P(x0, wd - .1, zs(x0) - .25), A.P(4.0, wd - .1, top - .3), dk(c, .6));
  lw(A.P(x0, wd - .1, zs(x0) + .95), A.P(4.0, wd - .1, top + .95), '#55627a'); lw(A.P(x0, wd - .1, zs(x0) + .55), A.P(4.0, wd - .1, top + .55), '#8a93a0'); lw(A.P(4.0, wd - .1, top + .95), A.P(5.1, wd - .1, top + .95), '#55627a'); lw(A.P(4.0, wd - .1, top + .5), A.P(5.1, wd - .1, top + .5), '#8a93a0');
  for (const x of [x0, x0 + .85, x0 + 1.7, 4.0, 5.1]) { const zz = x <= 4 ? zs(x) + .1 : top; lw(A.P(x, wd - .1, zz), A.P(x, wd - .1, zz + .88), '#55627a'); }
  for (const x of [2.2, 3.0]) lw(A.P(x, wd - .2, .6), A.P(x, wd - .2, zs(x) - .2), '#8a93a0');
  A.QY(.2, 1.4, wd - .1, .6, 1.0, acc); A.B(.2, .2, .6, 1.2, wd - .4, .4, dk(c, .1));
  lights(A, L, wd, .7); beacon(A, 4.4, .3, top + 1.0);
}
function followme(p) {
  const L = 3.2, A = along(p.dir, L), wd = 1.5, c = p.col || '#f2c230';
  A.W(.65, wd, 0, .3); A.W(2.5, wd, 0, .3);
  A.B(0, 0, .25, L, wd, .55, c); A.QY(0, L, wd, .42, .62, (u, v) => ((Math.floor(u / 3) + Math.floor(v / 2)) & 1) ? '#2a2f3d' : c);
  A.B(.7, .08, .8, 1.7, wd - .16, .5, c, { t: winter() ? SNOW : undefined }); A.WY(.82, 1.5, wd - .08, .85, 1.22, { on: false, glass: ['#34425a', '#465a78'] }); A.WY(1.58, 2.3, wd - .08, .85, 1.22, { on: false, glass: ['#34425a', '#465a78'] });
  if (A.f) winX(2.4, .18, wd - .18, .85, 1.22, { on: false, glass: ['#2b3a52', '#3d506e'] }); else winX(L - .7, .18, wd - .18, .85, 1.22, { on: false, glass: ['#2b3a52', '#3d506e'] });
  const t = 'FOLLOW ME', sw = tw(t) / 16 + .3, x0 = A.f ? .55 : L - .55 - sw; box(x0, wd / 2 - .08, 1.3, sw, .16, .55, '#2a2f3d');
  bsignY(t, x0, x0 + sw, wd / 2 + .09, 1.33, 1.82, '#1b2233', '#ffd24a', { lit: true });
  lights(A, L, wd, .55); beacon(A, .9, wd / 2, 1.95); beacon(A, 2.3, wd / 2, 1.95);
}

const V2 = v => [Object.assign({ dir: 1 }, v), Object.assign({ dir: -1 }, v)];
export default [
  { id: 'veh.airport.baggagetug', kind: 'vehicle', tags: ['airport', 'apron', 'service'], size: [2.2, 1.2, 1.9], vb: [-.3, -.3, 0, 2.5, 1.5, 2.3], variants: [...V2({}), { dir: 1, col: '#f2c230', accent: '#2a2f3d' }], draw: p => tug(p) },
  { id: 'veh.airport.baggagecart', kind: 'vehicle', tags: ['airport', 'apron', 'service', 'luggage'], size: [2.6, 1.3, 1.7], vb: [-.3, -.3, 0, 3.0, 1.6, 2.0], variants: [{ dir: 1, seed: 1 }, { dir: -1, seed: 2, cover: '#d8483a' }, { dir: 1, seed: 3, load: 0, cover: '#2f8f8a' }], draw: p => cart(p, 2.6, p.seed || 1) },
  { id: 'veh.airport.baggagetrain', kind: 'vehicle', tags: ['airport', 'apron', 'service', 'luggage'], size: p => [2.2 + (p.carts === undefined ? 3 : p.carts) * 3.0, 1.3, 1.9], vb: p => [-.3, -.3, 0, 2.5 + (p.carts === undefined ? 3 : p.carts) * 3.0, 1.6, 2.3], variants: [{ dir: 1, carts: 3, seed: 1 }, { dir: -1, carts: 2, seed: 5, cover: '#d8483a' }, { dir: 1, carts: 4, seed: 9, cover: '#2f8f8a', col: '#f2c230', accent: '#2a2f3d' }], draw: train },
  { id: 'veh.airport.pushback', kind: 'vehicle', tags: ['airport', 'apron', 'service'], size: [3.6, 1.9, 1.6], vb: [-.3, -.3, 0, 4.2, 2.2, 2.1], variants: [...V2({}), { dir: 1, col: '#f4f2ea' }], draw: pushback },
  { id: 'veh.airport.fueltruck', kind: 'vehicle', tags: ['airport', 'apron', 'service', 'fuel'], size: [6.4, 1.8, 2.3], vb: [-.3, -.3, 0, 6.7, 2.1, 2.7], variants: [...V2({}), { dir: 1, accent: '#2f7fd0', name: 'AVFUEL' }], draw: fuelTruck },
  { id: 'veh.airport.catering', kind: 'vehicle', tags: ['airport', 'apron', 'service'], size: p => [5.6, 1.8, 2.6 + (p.up || 0) * 1.5], vb: p => [-.3, -.3, 0, 5.9, 2.1, 2.9 + (p.up || 0) * 1.5], variants: [{ dir: 1, up: 0 }, { dir: -1, up: 0 }, { dir: 1, up: 1 }, { dir: -1, up: 1, accent: '#d8483a', name: 'GATE GOURMET'.slice(0, 4) + ' EATS' }], draw: catering },
  { id: 'veh.airport.stairs', kind: 'vehicle', tags: ['airport', 'apron', 'service'], size: [5.2, 1.6, 3.7], vb: [-.3, -.3, 0, 5.5, 1.9, 4.0], variants: [...V2({}), { dir: 1, accent: '#d8483a', top: 2.2, name: 'BAYJET' }], draw: stairs },
  { id: 'veh.airport.followme', kind: 'vehicle', tags: ['airport', 'apron', 'service', 'car'], size: [3.2, 1.5, 1.9], vb: [-.3, -.3, 0, 3.5, 1.8, 2.3], variants: V2({}), draw: followme },
];
