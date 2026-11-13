// Light-rail train car. Local box [0..12, 0..2.2, 0..2.6]; z = 0 is the track bed (viaduct deck top / ballast top).
// The engine places cars end to end along x with a 0.4 gap (pitch 12.4): the gangway bellows / couplers fill the gap.
// Params: head 'front' (cab at +x) | 'rear' (cab at -x) | 'mid'; livery 'line1' | 'line2' (or body/accent/roof colours);
//         dir 1|-1 (which way the train runs: white head lamps or red tail lamps on the visible cab), dest (side display, <= 7 chars),
//         line (number on the nose), panto (false = no pantograph), seed (passenger silhouettes), lights (false = dark, depot)
import { box, qy, qx, qz, lw, fq, lit, glow, dk, lt, mix, ENV, rng } from '../../engine/raster.js';
import { prof, COL, disc, lamp, halo, paxWindows, ledY, ledX } from './_lib.js';

export const LIVERY = { line1: { body: '#f1ead6', accent: '#d2412f', roof: '#b9bec4' }, line2: { body: '#2f8f96', accent: '#f2c230', roof: '#c9ced6' } };
const L = 12, W = 2.2, ZB = .45, ZS = 2.2, ZR = 2.38;

function bogie(x) {
  box(x, .15, .12, 1.9, W - .25, .36, '#35323f', { ol: false });
  qy(x + .1, x + 1.8, W - .1, .3, .46, '#4a4856');
  for (const wx of [x + .42, x + 1.48]) disc('y', wx, W - .1, .3, .26, (a, b, d, rp) => d > rp - 1.4 ? '#25212d' : d < .8 ? '#3d3b49' : '#8d939e');
  lw([x, W - .1, .12], [x + 1.9, W - .1, .12], '#1f1c28');
}
function panto(x, y) {
  const s = '#3a3644', h = '#56636b';
  box(x - .5, y - .35, ZR, 1.0, .7, .06, '#4a4856', { ol: false });
  for (const yy of [y - .28, y + .28]) { lw([x - .4, yy, ZR + .06], [x + .35, yy, ZR + .5], h); lw([x + .35, yy, ZR + .5], [x - .1, yy, 3.44], s); }
  lw([x + .35, y - .28, ZR + .5], [x + .35, y + .28, ZR + .5], h);
  lw([x - .1, y - .62, 3.46], [x - .1, y + .62, 3.46], '#25212d'); lw([x - .1, y - .62, 3.46], [x - .1, y - .7, 3.4], '#25212d'); lw([x - .1, y + .62, 3.46], [x - .1, y + .7, 3.4], '#25212d');
}

export function drawCar(p) {
  const lv = LIVERY[p.livery] || LIVERY.line1, body = p.body || lv.body, acc = p.accent || lv.accent, roofC = p.roof || lv.roof;
  const cf = p.head === 'front', cr = p.head === 'rear', on = p.lights !== false, fwd = p.dir !== -1, seed = p.seed || 1, r = rng(seed * 7 + 3);
  const dAcc = dk(acc, .18), frame = '#2a2634', dest = String(p.dest === undefined ? 'CENTRAL' : p.dest).slice(0, 8);
  // headlight beam on the track (drawn first: it lies on the ground)
  if (on && ((cf && fwd) || (cr && !fwd))) glow(() => { const a = cf ? L : 0, b = cf ? L + 3 : -3; fq([[a, .2, .03], [b, -.2, .03], [b, W + .2, .03], [a, W - .2, .03]], '#4a4c6c'); });
  // rear gangway (toward the previous car) / rear coupler
  if (!cr) { box(-.2, .38, .62, .2, W - .76, 1.56, '#3a3644', { l: (u, v) => u % 2 ? '#2e2b38' : '#454250', ol: false }); box(-.2, .8, .3, .2, .6, .2, '#35323f', { ol: false }); }
  else box(-.16, .85, .34, .16, .5, .2, '#35323f', { ol: false });
  bogie(1.3); bogie(8.8);
  box(3.6, .25, .2, 4.8, W - .4, .26, '#3d3b49', { ol: false }); qy(3.9, 5.3, W - .15, .2, .44, '#4a4856'); qy(6.2, 8.0, W - .15, .2, .44, '#56535f'); lw([3.9, W - .15, .2], [8.0, W - .15, .2], '#1f1c28'); // underfloor equipment
  // body shell
  const pts = []; if (cr) pts.push([0, 1.1], [.2, 1.25], [1.25, ZS]); else pts.push([0, ZS]);
  if (cf) pts.push([L - 1.25, ZS], [L - .2, 1.25], [L, 1.1]); else pts.push([L, ZS]);
  prof(pts, 0, W, ZB, body);
  const rx0 = cr ? 1.25 : 0, rx1 = cf ? L - 1.25 : L;
  // roof with a chamfered shoulder
  fq([[rx0, .2, ZR], [rx1, .2, ZR], [rx1, 0, ZS], [rx0, 0, ZS]], dk(roofC, .3));
  qz(rx0, rx1, .2, W - .2, ZR, roofC);
  fq([[rx0, W, ZS], [rx1, W, ZS], [rx1, W - .2, ZR], [rx0, W - .2, ZR]], lt(roofC, .25));
  if (!cf) fq([[L, 0, ZS], [L, W, ZS], [L, W - .2, ZR], [L, .2, ZR]], dk(roofC, .34));
  lw([rx0, .2, ZR], [rx1, .2, ZR], dk(roofC, .6)); lw([rx0, W, ZS], [rx1, W, ZS], dk(body, .35)); lw([rx0, W - .2, ZR], [rx1, W - .2, ZR], lt(roofC, .6));
  // livery: skirt band, waist stripe, cant-rail stripe
  qy(0, L, W, ZB, .98, dAcc); qy(0, L, W, .98, 1.04, lt(acc, .4)); lw([0, W, ZB], [L, W, ZB], dk(acc, .7));
  qy(rx0, rx1, W, 2.14, ZS, dAcc);
  if (cf) { fq([[L - 1.25, W, ZS], [L - .2, W, 1.25], [L, W, 1.1], [L, W, .98], [L - 1.9, W, .98], [L - 1.9, W, ZS]], dAcc); }
  if (cr) { fq([[1.25, W, ZS], [.2, W, 1.25], [0, W, 1.1], [0, W, .98], [1.9, W, .98], [1.9, W, ZS]], dAcc); }
  // doors
  const doors = [2.3, 6, 9.7], dw = .66, z0 = 1.1, z1 = 1.8;
  // windows between doors
  const spans = [[cr ? 99 : .35, 1.5], [3.1, 4.05], [4.25, 5.2], [6.8, 7.75], [7.95, 8.9], [10.5, cf ? -99 : 11.65]].filter(s => s[1] > s[0]);
  paxWindows(spans, W, z0, z1, seed, { frame });
  for (const d of doors) {
    qy(d - dw, d + dw, W, ZB + .06, 1.98, dk(body, .16));
    for (const [a, b] of [[d - dw + .1, d - .05], [d + .05, d + dw - .1]]) { qy(a, b, W, .95, 1.84, COL.glassA, COL.glassB); glow(() => qy(a, b, W, .95, 1.84, COL.warm, COL.warm2)); lw([a, W, .95], [b, W, .95], frame); lw([a, W, 1.84], [b, W, 1.84], frame); lw([a, W, .95], [a, W, 1.84], frame); lw([b, W, .95], [b, W, 1.84], frame); }
    lw([d, W, ZB + .06], [d, W, 1.98], frame); lw([d - dw, W, ZB + .06], [d - dw, W, 1.98], frame); lw([d + dw, W, ZB + .06], [d + dw, W, 1.98], frame); lw([d - dw, W, 1.98], [d + dw, W, 1.98], frame);
    qy(d - dw, d + dw, W, ZB, ZB + .06, '#f2c230');
    lamp(d, W, 2.07, on ? '#9cf2b0' : '#56636b', 0, 2, 1);
  }
  // cab side window + door
  if (cf) { const g = [[L - 1.75, 1.2], [L - 1.75, 1.84], [L - 1.2, 1.84], [L - .6, 1.3], [L - .6, 1.2]].map(q => [q[0], W, q[1]]); fq(g, COL.glassA, COL.glassB); for (let i = 0; i < g.length; i++) lw(g[i], g[(i + 1) % g.length], frame); lw([L - 1.9, W, ZB + .1], [L - 1.9, W, 2.1], dk(acc, .6)); }
  if (cr) { const g = [[1.75, 1.2], [1.75, 1.84], [1.2, 1.84], [.6, 1.3], [.6, 1.2]].map(q => [q[0], W, q[1]]); fq(g, COL.glassA, COL.glassB); for (let i = 0; i < g.length; i++) lw(g[i], g[(i + 1) % g.length], frame); lw([1.9, W, ZB + .1], [1.9, W, 2.1], dk(acc, .6)); }
  // destination displays above the windows
  if (on) { ledY(dest, 3.1, 5.2, W + .005, 1.84, 2.2); ledY(dest, 6.8, 8.9, W + .005, 1.84, 2.2); } else { qy(3.1, 5.2, W, 1.86, 2.18, '#1b2026'); qy(6.8, 8.9, W, 1.86, 2.18, '#1b2026'); }
  // line roundel next to the first door
  { const x = cr ? 10.98 : 1.0; if (!(cf && cr)) { disc('y', x, W, .72, .17, acc === '#f2c230' ? '#25212d' : '#f6f2e6'); disc('y', x, W, .72, .11, acc); } }
  // +x end
  if (cf) {
    // windscreen on the nose slope
    const a = [L - 1.12, 2.08], b = [L - .3, 1.34], q = [[a[0], .14, a[1]], [b[0], .14, b[1]], [b[0], W - .14, b[1]], [a[0], W - .14, a[1]]];
    fq(q, '#34466a', '#46608a'); if (on) glow(() => fq(q, '#6f6a5c', '#625e54')); for (let i = 0; i < 4; i++) lw(q[i], q[(i + 1) % 4], frame);
    lw([a[0], W / 2, a[1]], [b[0], W / 2, b[1]], frame); lw([a[0] + .25, W - .3, a[1] - .22], [a[0] + .6, W - .3, a[1] - .54], COL.glassHi);
    lw([b[0] - .02, .7, b[1] + .02], [b[0] - .3, .45, b[1] + .28], frame);                                          // wiper
    qx(L, 0, W, ZB, 1.1, dk(acc, .36)); qx(L, .04, W - .04, ZB, ZB + .1, '#3a3644');
    const ln = String(p.line === undefined ? (p.livery === 'line2' ? '2' : '1') : p.line).slice(0, 2);
    if (on) ledX(ln, L + .005, W / 2 - .28, W / 2 + .28, .6, 1.02, '#fff6cf'); else qx(L, W / 2 - .28, W / 2 + .28, .6, 1.02, '#1b2026');
    const c = fwd ? COL.head : COL.tail, d = () => { qx(L, .12, .5, .68, .9, c); qx(L, W - .5, W - .12, .68, .9, c); };
    if (on) { halo(L, .31, .79, 4, fwd ? '#fff8dc' : '#ff6a5a'); halo(L, W - .31, .79, 4, fwd ? '#fff8dc' : '#ff6a5a'); lit(d); } else d();
    box(L, .85, .34, .16, .5, .2, '#35323f', { ol: false });                                                        // coupler
    lw([L, 0, 1.1], [L, W, 1.1], lt(acc, .3));
  } else {
    qx(L, .5, W - .5, .6, 2.1, '#3a3644'); glow(() => qx(L, .7, W - .7, 1.0, 1.9, '#b89a62'));
    box(L, .38, .62, .2, W - .76, 1.56, '#3a3644', { l: (u, v) => u % 2 ? '#2e2b38' : '#454250', r: '#2e2b38', ol: false }); box(L, .8, .3, .2, .6, .2, '#35323f', { ol: false });
  }
  // side marker lamps at the cab corners
  if (cf) lamp(L - .1, W, .8, fwd ? COL.head : COL.tail, 0, 2, 2); if (cr) lamp(.1, W, .8, fwd ? COL.tail : COL.head, on ? 3 : 0, 2, 2);
  // roof equipment
  for (let x = rx0 + .6; x < rx1 - .3; x += 1.2) lw([x, .2, ZR], [x, W - .2, ZR], dk(roofC, .2));
  const snow = ENV.season === 3;
  if (snow) { qz(rx0 + .1, rx1 - .1, .3, W - .3, ZR + .01, COL.snow, 'glass'); }
  box(2.2, .45, ZR, 2.0, W - .9, .2, '#aab0ba'); for (let x = 2.4; x < 4.1; x += .3) lw([x, W - .45, ZR + .04], [x, W - .45, ZR + .18], '#56636b'); if (snow) qz(2.25, 4.15, .5, W - .5, ZR + .21, COL.snow);
  box(9.0, .5, ZR, 1.2, W - 1.0, .16, '#8d939e'); if (snow) qz(9.05, 10.15, .55, W - .55, ZR + .17, COL.snow);
  if (p.panto !== false) panto(6.6, W / 2);
}

const car = (o) => Object.assign({ seed: 1 }, o);
export default [
  {
    id: 'veh.train.car', kind: 'vehicle', tags: ['transit', 'vehicle', 'train', 'lightrail'], size: [12, 2.2, 2.6], vb: [-3.1, -.4, 0, 15.1, 2.6, 3.7],
    variants: [car({ head: 'front', livery: 'line1', dest: 'CENTRAL' }), car({ head: 'mid', livery: 'line1', seed: 2 }), car({ head: 'rear', livery: 'line1', seed: 3 }),
      car({ head: 'front', livery: 'line2', dest: 'AIRPORT', dir: -1 }), car({ head: 'mid', livery: 'line2', dest: 'AIRPORT', seed: 5, panto: false }), car({ head: 'rear', livery: 'line2', dest: 'AIRPORT', seed: 6, dir: -1 })],
    draw: drawCar,
  },
];
