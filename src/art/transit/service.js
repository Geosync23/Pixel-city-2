// Taxi, emergency, vans, trucks, buses. Same conventions as cars.js (u = 0 rear .. len front, p.dir maps it on x).
import { box, qy, qx, qz, lw, fq, lit, glow, dk, lt, mix, ENV, PW, px, C, isFlipped, textY, textX, textW, cone, ball, PAT, U } from '../../engine/raster.js';
import { mk, COL, disc, wheel, lamp, halo, paxWindows, ledY, ledX } from './_lib.js';
import { stdCar, SPEC, vbOf, cv } from './cars.js';

const V = (len, wid, h, tags, variants, draw, extra) => Object.assign({ kind: 'vehicle', tags: ['transit', 'vehicle', ...tags], size: [len, wid, h], vb: vbOf(len, wid, h + .5), variants, draw }, extra || {});
/** text on the visible long side, centred between u0..u1 with its top at z */
function sideText(K, str, u0, u1, z, c, y) { const a = Math.min(K.X(u0), K.X(u1)), b = Math.max(K.X(u0), K.X(u1)); textY(str, a + ((b - a) - textW(str) / U) / 2, y === undefined ? K.wid : y, z, c); }
/** flashing-light bar across the roof at u; colours for the two halves */
function lightBar(K, u, z, c1, c2, on, y0 = .25, y1) {
  y1 = y1 === undefined ? K.wid - .25 : y1; const m = (y0 + y1) / 2, x = Math.min(K.X(u), K.X(u + .22));
  box(x, y0, z, .22, y1 - y0, .06, '#3a3644', { ol: false });
  const d = () => { box(x, y0, z + .06, .22, m - y0 - .06, .12, c1, { ol: false }); box(x, m + .06, z + .06, .22, y1 - m - .06, .12, c2, { ol: false }); };
  if (on) { halo(x + .1, y0 + .2, z + .14, 4, lt(c1, .2)); halo(x + .1, y1, z + .14, 4, lt(c2, .2)); lit(d); } else d();
  box(x, m - .06, z + .06, .22, .12, .12, '#e8e4da', { ol: false });
}
/** one-box van body. s: {len,wid,top,zb,wr} */
function vanShell(p, s, colDef, fn) {
  const K = mk(p, s.len, s.wid, colDef), L = s.len, T = s.top, zb = s.zb || .36, W = s.wid;
  K.beam(); K.chassis(zb);
  const body = [[0, T - .2], [.08, T], [L - .95, T], [L - .5, T - .68], [L - .12, T - .8], [L, T - 1.16]];
  K.body(body, 0, W, zb);
  if (fn.paint) fn.paint(K);
  K.lineY(.12, zb + .05, L - .12, zb + .05, W, dk(K.col, .3));
  K.glassT(L - .9, T - .08, L - .54, T - .62, .12, W - .12);
  K.glassY([[L - 1.32, T - .66], [L - 1.32, T - .16], [L - .98, T - .16], [L - .64, T - .66]], W);
  K.doorLine(L - 1.42, zb + .08, T - .1); K.handle(L - 1.36, T - .8); K.mirror(L - .72, T - .66);
  if (fn.side) fn.side(K);
  K.wheels([.8, L - .85], s.wr || .34);
  const zt = K.f ? T - 1.16 : T - .2;
  if (K.f) K.end(zb, zt, { lz: zt - .24 });
  else { K.end(zb, zt, { lz: zb + .16, lw: .2, lh: .34, plate: false }); const x = L; lw([x, W / 2, zb + .1], [x, W / 2, zt - .05], dk(K.col, .55)); if (fn.rearGlass !== false) { qx(x, .2, W / 2 - .08, T - .85, T - .35, COL.glassA, COL.glassB); qx(x, W / 2 + .08, W - .2, T - .85, T - .35, COL.glassA, COL.glassB); } qx(x, W / 2 - .2, W / 2 + .2, zb + .14, zb + .26, '#f1ede0'); }
  K.markers(T - 1.3, T - .5);
  if (fn.top) fn.top(K);
  if (p.parked && ENV.season === 3) K.snow(.3, L - 1.1, .2, W - .2, T);
  return K;
}
const VAN = { len: 3.8, wid: 1.6, top: 1.88 };

/** cab-over truck cab occupying u0..u1 */
function truckCab(K, u0, u1, zb, zt, c) {
  const W = K.wid;
  K.body([[u0, zt], [u1 - .5, zt], [u1 - .12, zt - .72], [u1, zt - .78]], 0, W, zb, c);
  K.glassT(u1 - .46, zt - .08, u1 - .16, zt - .64, .12, W - .12, { frame: dk(c, .62) });
  K.glassY([[u1 - 1.0, zt - .7], [u1 - 1.0, zt - .18], [u1 - .56, zt - .18], [u1 - .28, zt - .7]], W, { frame: dk(c, .62) });
  K.doorLine(u1 - 1.1, zb + .1, zt - .1, dk(c, .3)); K.handle(u1 - 1.04, zt - .84); K.mirror(u1 - .3, zt - .6);
  K.rectY(u1 - 1.0, u1 - .6, W, zb + .02, zb + .1, '#3a3644');
}
function truckEnd(K, zb, zFront, zRear, o) {
  if (K.f) K.end(zb, zFront, Object.assign({ lz: zb + .2, gz0: zb + .46, gz1: zFront - .1 }, o));
  else K.end(zb, zRear, Object.assign({ lz: zb + .14, lw: .26, lh: .16 }, o));
}

function drawBus(p, dd) {
  const L = 8, W = 1.8, K = mk(p, L, W, '#3f9a6a'), col = K.col, cream = p.cream || '#f1ead6', zb = .36, T = dd ? 3.8 : 2.3, r = .4, X = K.X;
  const route = String(p.route === undefined ? '12' : p.route), dest = p.dest === undefined ? 'HARBOR' : p.dest, night = { glow: ['#ffe6a8', '#f5d48a'] };
  K.beam(); K.chassis(zb, .2, L - .2);
  const span = (a, b) => [Math.min(X(a), X(b)), Math.max(X(a), X(b))];
  // shell
  box(0, 0, zb, L, W, T - zb, cream, { ol: true });
  qy(0, L, W, zb, 1.0, dk(col, .18)); qx(L, 0, W, zb, 1.0, dk(col, .36));                    // green skirt
  qy(0, L, W, 1.0, 1.06, lt(col, .45)); lw([0, W, zb + .08], [L, W, zb + .08], dk(col, .5));
  if (dd) { qy(0, L, W, 1.92, 2.4, dk(col, .18)); qx(L, 0, W, 1.92, 2.4, dk(col, .36)); qy(0, L, W, 2.4, 2.44, lt(col, .45)); }
  qy(0, L, W, T - .1, T, dk(col, .18)); qz(.3, L - .3, .25, W - .25, T + .001, dk(cream, .08));  // roof panel
  // windows (lower deck)
  const z0 = 1.12, z1 = 1.84, doors = K.curb ? [[6.55, 7.45], [3.1, 4.1]] : [], wins = [];
  const cuts = doors.map(d => [d[0] - .08, d[1] + .08]).sort((a, b) => a[0] - b[0]); let u = .3; const stops = [...cuts, [K.curb ? 7.5 : 6.75, 99]];
  for (const c of stops) { for (let a = u; a + .5 <= c[0]; a += .92) wins.push(span(a, Math.min(a + .8, c[0]))); u = c[1]; }
  paxWindows(wins.sort((a, b) => a[0] - b[0]), W, z0, z1, (p.seed || 3) + 11);
  if (!K.curb) K.glassY([[6.85, z0 - .2], [6.85, z1], [7.72, z1], [7.72, z0 - .2]], W, night);  // driver window
  else K.glassY([[7.56, z0 - .2], [7.56, z1], [7.84, z1], [7.84, z0 - .2]], W, night);
  for (const [a, b] of doors) {
    const [x0, x1] = span(a, b), m = (x0 + x1) / 2; qy(x0, x1, W, zb + .06, 2.0, '#2c3340');
    for (const [s, e] of [[x0 + .06, m - .03], [m + .03, x1 - .06]]) { qy(s, e, W, zb + .2, 1.9, COL.glassA, COL.glassB); glow(() => qy(s, e, W, zb + .2, 1.9, COL.warm, COL.warm2)); }
    lw([m, W, zb + .06], [m, W, 2.0], '#1b2026'); lw([x0, W, zb + .06], [x0, W, 2.0], '#1b2026'); lw([x1, W, zb + .06], [x1, W, 2.0], '#1b2026'); lw([x0, W, 2.0], [x1, W, 2.0], '#1b2026');
    lamp(m, W, 2.07, '#9cf2b0', 0, 2, 1);
  }
  if (dd) { const ws = []; for (let a = .3; a + .5 <= 7.7; a += .92) ws.push(span(a, a + .8)); paxWindows(ws.sort((a, b) => a[0] - b[0]), W, 2.6, 3.3, (p.seed || 3) + 29, { pax: .7 }); sideText(K, p.ad || 'VISIT MAPLE BAY', .6, 5.6, 2.33, cream); }
  // side destination display
  { const txt = route + ' ' + dest, wd = (textW(txt) + 6) / U, zD = dd ? 2.0 : 1.9, [x0] = span(K.f ? 7.3 - wd : 5.2, K.f ? 7.3 : 5.2 + wd), uOK = !dd || true; if (uOK) ledY(txt, K.f ? X(7.3) - wd : X(7.3), K.f ? X(7.3) : X(7.3) + wd, W + .01, zD, zD + .4); }
  // wheels
  for (const uu of [1.7, 6.3]) wheel(X(uu), W, r, r, '#8d939e');
  // ends
  const x = L, zt = T;
  qx(x, .04, W - .04, zb, zb + .12, '#3a3644');
  if (K.f) {
    const wz1 = dd ? 1.86 : 1.86; qx(x, .1, W - .1, 1.02, wz1, '#34466a', '#46608a'); glow(() => qx(x, .1, W - .1, 1.02, wz1, '#8f8468', '#7d745e'));
    lw([x, .1, 1.02], [x, W - .1, 1.02], '#1b2026'); lw([x, .1, wz1], [x, W - .1, wz1], '#1b2026'); lw([x, W / 2, 1.02], [x, W / 2, wz1], '#1b2026');
    lw([x, .5, 1.04], [x, .75, 1.4], '#1b2026'); lw([x, 1.15, 1.04], [x, 1.4, 1.4], '#1b2026');                         // wipers
    if (dd) { qx(x, .1, W - .1, 2.6, 3.3, '#34466a', '#46608a'); glow(() => qx(x, .1, W - .1, 2.6, 3.3, COL.warm, COL.warm2)); lw([x, W / 2, 2.6], [x, W / 2, 3.3], '#1b2026'); lw([x, .1, 2.6], [x, W - .1, 2.6], '#1b2026'); lw([x, .1, 3.3], [x, W - .1, 3.3], '#1b2026'); }
    const dz = dd ? 3.36 : 1.9; ledX(route, x + .01, .15, W - .15, dz, dz + .38);
    const d = () => { qx(x, .12, .46, .56, .74, COL.head); qx(x, W - .46, W - .12, .56, .74, COL.head); };
    if (K.on) { halo(x, .29, .65, 4, '#fff8dc'); halo(x, W - .29, .65, 4, '#fff8dc'); lit(d); } else d();
    qx(x, W / 2 - .22, W / 2 + .22, .5, .62, '#f1ede0');
    box(x - .1, W, 1.7, .1, .16, .3, '#2c3340', { ol: false }); // mirror
  } else {
    qx(x, .2, W - .2, 1.2, 1.84, COL.glassA, COL.glassB); glow(() => qx(x, .2, W - .2, 1.2, 1.84, COL.warm, COL.warm2)); lw([x, .2, 1.2], [x, W - .2, 1.2], '#1b2026'); lw([x, .2, 1.84], [x, W - .2, 1.84], '#1b2026');
    if (dd) { qx(x, .2, W - .2, 2.6, 3.3, COL.glassA, COL.glassB); glow(() => qx(x, .2, W - .2, 2.6, 3.3, COL.warm, COL.warm2)); }
    for (let z = .56; z < .95; z += .1) lw([x, .5, z], [x, W - .5, z], dk(col, .6));                                    // engine louvres
    ledX(route, x + .01, W / 2 - .3, W / 2 + .3, dd ? 3.36 : 1.9, (dd ? 3.36 : 1.9) + .36);
    const d = () => { qx(x, .1, .3, .5, .9, COL.tail); qx(x, W - .3, W - .1, .5, .9, COL.tail); };
    if (K.on) { halo(x, .2, .7, 3, '#ff6a5a'); halo(x, W - .2, .7, 3, '#ff6a5a'); lit(d); } else d();
  }
  K.markers(.62, .62);
  // roof kit
  if (!dd) { const [a] = span(2.2, 4.4); box(a, .35, T, 2.2, W - .7, .12, '#c9ced6'); const [b] = span(5.6, 6.4); box(b, .5, T, .8, W - 1, .08, '#aab0ba'); }
  else { for (const uu of [2, 4, 6]) lw([X(uu), .25, T], [X(uu), W - .25, T], dk(cream, .25)); }
  if (p.parked && ENV.season === 3) K.snow(.4, L - .4, .3, W - .3, T + (dd ? 0 : .12));
}

export default [
  V(3.2, 1.5, 1.3, ['taxi', 'car'], [{ dir: 1 }, { dir: -1 }, { dir: 1, free: false }, { dir: -1, parked: true }], p => {
    const s = Object.assign({}, SPEC.sedan, { col: '#f2c230', trim: 0,
      extra(K) {
        for (let i = 0, u = .98; u < 2.26; u += .0625 * 2, i++) { K.rectY(u, Math.min(u + .125, 2.3), K.wid, .56, .66, i % 2 ? '#f6f2e6' : '#25212d'); }
        for (let i = 0, u = .98 + .125; u < 2.26; u += .125, i++) K.rectY(u, Math.min(u + .125, 2.3), K.wid, .46, .56, i % 2 ? '#f6f2e6' : '#25212d');
        const x0 = Math.min(K.X(.95), K.X(1.9)) + .02, free = p.free !== false && !p.parked;
        box(x0, .55, 1.3, .9, .4, .08, '#25212d', { ol: false });
        box(x0 + .05, .62, 1.36, .8, .26, .34, free ? '#ffe08a' : '#8a7a4a');
        const d = () => { qy(x0 + .05, x0 + .85, .88, 1.36, 1.7, free ? '#ffe08a' : '#6f6340'); textY('TAXI', x0 + .05 + (.8 - 15 / U) / 2, .88, 1.67, free ? '#25212d' : '#3d3628'); qx(x0 + .85, .62, .88, 1.36, 1.7, free ? '#f2c230' : '#5e5436'); };
        if (free) { halo(x0 + .45, .88, 1.52, 6, '#ffe9a8'); lit(d); } else d();
      } });
    stdCar(p, s);
  }, { id: 'veh.taxi', vb: vbOf(3.2, 1.5, 1.9) }),

  V(3.2, 1.5, 1.3, ['police', 'emergency', 'car'], [{ dir: 1, siren: true }, { dir: -1, siren: true }, { dir: 1, siren: false, parked: true }], p => {
    const s = Object.assign({}, SPEC.sedan, { col: '#f1efe8', trim: 0,
      pre(K) { K.rectY(.98, 2.3, K.wid, .36, .82, '#2c4a9a'); K.rectY(.1, 3.1, K.wid, .36, .44, '#2c4a9a'); },
      extra(K) { sideText(K, 'POLICE', .98, 2.3, .74, '#f6f2e6'); lightBar(K, 1.32, 1.3, '#ff3b3b', '#3b7bff', p.siren !== false && !p.parked); } });
    stdCar(p, s);
  }, { id: 'veh.police', vb: vbOf(3.2, 1.5, 1.7) }),

  V(3.8, 1.6, 1.9, ['van'], cv(['#f1efe8', '#31556b', '#7a7f8c', '#b5654a']), p => {
    vanShell(p, VAN, '#f1efe8', { side(K) { K.glassY([[1.55, 1.22], [1.55, 1.72], [2.3, 1.72], [2.3, 1.22]], K.wid); K.glassY([[.4, 1.22], [.4, 1.72], [1.35, 1.72], [1.35, 1.22]], K.wid); K.doorLine(1.45, .44, 1.8); K.lineY(1.5, 1.1, 2.4, 1.1, K.wid, dk(K.col, .3)); } });
  }, { id: 'veh.van' }),

  V(3.8, 1.6, 1.9, ['van', 'delivery', 'courier', 'zip'], [{ dir: 1 }, { dir: -1 }, { dir: 1, color: '#2b2a38', accent: '#f2c230' }], p => {
    const acc = p.accent || '#f26a2e';
    vanShell(p, VAN, '#f6f2e6', { rearGlass: false,
      paint(K) { K.rectY(.1, 2.36, K.wid, .42, .7, acc); K.polyY([[.1, .7], [2.36, .7], [1.9, 1.0], [.1, 1.0]], K.wid, mix(acc, '#fff8e0', .25)); },
      side(K) { const a = Math.min(K.X(.5), K.X(2.0)); K.rectY(.62, 1.9, K.wid, 1.18, 1.72, acc); sideText(K, 'ZIP', .62, 1.9, 1.62, '#fff8e0');
        const s = PW(Math.min(K.X(.62), K.X(1.9)), K.wid, 1.45), d = isFlipped() ? -1 : 1, c = C('#fff8e0'); for (let k = 0; k < 3; k++) for (let i = 0; i < 4 - k; i++) px(Math.round(s[0]) + d * (2 + i), Math.round(s[1]) + 1 + (i >> 1) + k * 2 + 3, c);
        K.doorLine(2.36, .44, 1.8); },
      top(K) { if (!K.f) { textX('ZIP', K.len, 1.25, 1.5, acc); } } });
  }, { id: 'veh.van.delivery' }),

  V(3.8, 1.6, 1.9, ['van', 'icecream', 'food'], [{ dir: 1 }, { dir: -1 }, { dir: 1, color: '#9fd8e8' }], p => {
    const cream = '#fff3d6';
    vanShell(p, VAN, '#f7a8c0', { rearGlass: false,
      paint(K) { K.rectY(.1, 2.9, K.wid, 1.1, 1.88, cream); K.rectY(.1, 2.9, K.wid, 1.04, 1.1, '#fff8e0'); for (let u = .12; u < 3.5; u += .5) disc('y', K.X(u + .1), K.wid, .62, .08, lt(K.col, .5)); },
      side(K) {
        const a = Math.min(K.X(.7), K.X(2.1)), b = a + 1.4, W = K.wid;
        qy(a, b, W, 1.12, 1.66, '#5a4a52'); qy(a + .06, b - .06, W, 1.16, 1.62, '#7a5a62', '#6a4e58'); glow(() => qy(a + .06, b - .06, W, 1.16, 1.62, COL.warm, COL.warm2));
        qy(a + .2, a + .5, W, 1.16, 1.34, '#f6f2e6'); qy(a + .8, a + 1.1, W, 1.16, 1.3, '#9fd8e8');                      // tubs
        box(a - .05, W, 1.06, 1.5, .16, .06, '#e8e4da', { ol: false });                                               // counter
        box(a - .08, W, 1.68, 1.56, .34, .06, cream, { t: PAT.ftile('#f7a8c0', cream, .25), l: '#f7a8c0', ol: false }); // awning
        sideText(K, 'ICES', .3, 2.4, .9, '#fff8e0');
      },
      top(K) {
        const x = K.X(2.2), y = K.wid / 2; cone(x, y, 2.5, .2, -.62, '#d9a05a'); ball(x, y, 2.6, .22, '#fff3d6'); ball(x - .02, y, 2.82, .16, '#f7a8c0'); lamp(x - .02, y, 3.0, '#ff5a5a', K.on ? 2 : 0, 2, 2);
        for (let u = .3; u < 2.7; u += .4) lamp(K.X(u), K.wid, 1.9, ['#ffe08a', '#ff8a8a', '#9cf2b0', '#9fd8ff'][Math.round(u * 5) % 4], 0, 1, 1);
      } });
  }, { id: 'veh.van.icecream', vb: vbOf(3.8, 1.6, 3) }),

  V(4.4, 1.7, 2.2, ['ambulance', 'emergency'], [{ dir: 1 }, { dir: -1 }, { dir: 1, siren: false, parked: true }], p => {
    const L = 4.4, W = 1.7, K = mk(p, L, W, '#f6f2e6'), zb = .4, c = K.col, red = '#e0453a';
    K.beam(); K.chassis(zb);
    K.seq([
      [1.4, () => { K.box(0, 2.95, 0, W, zb, 2.2, c); K.rectY(0, 2.95, W, .86, 1.06, red); K.rectY(0, 2.95, W, .8, .84, '#f2c230');
        const m = Math.min(K.X(.5), K.X(.95)); qy(m + .16, m + .3, W, 1.3, 1.9, red); qy(m, m + .46, W, 1.52, 1.68, red);                       // cross
        K.glassY([[1.5, 1.4], [1.5, 1.9], [2.3, 1.9], [2.3, 1.4]], W, { glow: ['#cfe6fa', '#b8d6f0'], frame: '#56636b' }); K.doorLine(1.35, zb + .1, 2.1, '#aaa69c'); K.doorLine(2.45, zb + .1, 2.1, '#aaa69c'); }],
      [3.6, () => { K.body([[2.95, 1.75], [3.5, 1.75], [3.85, 1.12], [4.28, 1.02], [4.4, .7]], 0, W, zb, c); K.glassT(3.54, 1.68, 3.82, 1.18, .12, W - .12); K.glassY([[3.05, 1.16], [3.05, 1.64], [3.44, 1.64], [3.7, 1.16]], W); K.rectY(2.95, 4.3, W, .86, 1.0, red); K.handle(3.08, 1.02); K.mirror(3.6, 1.16); }],
    ]);
    K.wheels([.85, 3.5], .36);
    if (K.f) K.end(zb, .7, { lz: .48 }); else { K.end(zb, 2.2, { lz: zb + .14, lw: .2, lh: .3, plate: false }); lw([L, W / 2, zb + .1], [L, W / 2, 2.1], '#aaa69c'); qx(L, .25, W / 2 - .1, 1.4, 1.9, COL.glassA, COL.glassB); qx(L, W / 2 + .1, W - .25, 1.4, 1.9, COL.glassA, COL.glassB); qx(L, .1, W - .1, .86, 1.06, red); }
    K.markers(.56, .6);
    lightBar(K, 2.7, 2.2, '#3b7bff', '#3b7bff', p.siren !== false && !p.parked, .2, W - .2);
    if (!K.f) lightBar(K, .05, 2.2, '#ff3b3b', '#ff3b3b', p.siren !== false && !p.parked, .3, W - .3);
  }, { id: 'veh.ambulance', vb: vbOf(4.4, 1.7, 2.7) }),

  V(5.6, 1.9, 2.7, ['truck', 'boxtruck', 'delivery'], [{ dir: 1, name: 'MOVERS' }, { dir: -1, color: '#31556b', box: '#e9dcc0', name: 'MAPLE FOODS' }, { dir: 1, color: '#f26a2e', box: '#f6f2e6', name: 'ZIP' }], p => {
    const L = 5.6, W = 1.9, K = mk(p, L, W, '#d64545'), zb = .5, bc = p.box || '#f1efe8';
    K.beam(); K.chassis(zb, .2, L - .2);
    K.seq([
      [2, () => { K.box(0, 3.9, 0, W, zb + .1, 2.7, bc); K.rectY(0, 3.9, W, zb + .1, zb + .22, dk(bc, .3)); K.rectY(.25, 3.65, W, 1.25, 2.05, mix(bc, K.col, .9)); sideText(K, p.name || 'MOVERS', .25, 3.65, 1.82, '#fff8e0');
        for (const u of [.02, 3.88]) K.lineY(u, zb + .1, u, 2.7, W, dk(bc, .4)); K.box(1.2, 2.6, W - .08, W, zb - .1, zb + .1, '#3a3644', { ol: false }); }],
      [4.8, () => truckCab(K, 4.0, 5.6, zb - .1, 2.0, K.col)],
    ]);
    K.wheels([.95, 4.75], .42, { hub: '#8d939e' });
    truckEnd(K, zb - .1, 1.22, 2.7, K.f ? {} : { plate: false });
    if (!K.f) { for (let z = zb + .4; z < 2.6; z += .22) lw([L, .12, z], [L, W - .12, z], dk(bc, .22)); lw([L, .1, zb + .26], [L, W - .1, zb + .26], dk(bc, .5)); }
    K.markers(.7, .64);
    if (p.parked && ENV.season === 3) K.snow(.2, 3.7, .2, W - .2, 2.7);
  }, { id: 'veh.truck.box' }),

  V(5.6, 1.9, 2.6, ['truck', 'garbage', 'service'], [{ dir: 1 }, { dir: -1 }, { dir: 1, color: '#e8a33a' }], p => {
    const L = 5.6, W = 1.9, K = mk(p, L, W, '#3f8a5a'), zb = .5, c = K.col, st = '#c9ced6';
    K.beam(); K.chassis(zb, .2, L - .2);
    K.seq([
      [2, () => {
        K.body([[0, 1.1], [.5, 2.25], [.9, 2.5], [3.85, 2.5]], 0, W, zb + .05, c);
        for (let u = 1.2; u < 3.8; u += .55) K.lineY(u, zb + .15, u, 2.48, W, dk(c, .32));
        K.lineY(.9, 1.5, 3.85, 1.5, W, lt(c, .35)); K.polyY([[.06, 1.1], [.5, 2.1], [.86, 2.3], [.86, .7], [.06, .7]], W, dk(c, .34)); K.lineY(.5, 2.2, .86, .75, W, st);   // packer mechanism
        K.rectY(1.3, 3.3, W, .8, 1.3, '#f6f2e6'); sideText(K, 'MAPLE BAY', 1.3, 3.3, 1.2, c);
        K.box(0, .3, 0, W, zb, .75, '#4a4856', { ol: false });
      }],
      [4.8, () => truckCab(K, 4.0, 5.6, zb - .1, 2.1, '#f1efe8')],
    ]);
    K.wheels([.9, 1.75, 4.75], .42, { hub: '#8d939e' });
    truckEnd(K, zb - .1, 1.32, 1.1, K.f ? {} : { plate: false });
    if (!K.f) { for (let y = .15; y < W - .2; y += .5) qx(L, y, y + .25, .52, .62, '#f2c230'); }
    K.markers(.7, .66);
    lamp(K.X(4.5), W / 2, 2.2, '#ffb347', K.on ? 3 : 0, 3, 2);
  }, { id: 'veh.truck.garbage' }),

  V(6.2, 1.9, 2.5, ['truck', 'fire', 'emergency'], [{ dir: 1 }, { dir: -1 }, { dir: 1, siren: false, parked: true }], p => {
    const L = 6.2, W = 1.9, K = mk(p, L, W, '#d63a32'), zb = .46, c = K.col, st = '#c9ced6';
    K.beam(); K.chassis(zb, .2, L - .2);
    K.seq([
      [1.7, () => {
        K.box(0, 3.5, 0, W, zb, 2.05, c); K.rectY(0, 3.5, W, 1.0, 1.12, '#f6f2e6'); K.rectY(0, 3.5, W, 1.12, 1.16, '#f2c230');
        for (const [a, b] of [[.25, 1.2], [1.35, 2.3], [2.45, 3.3]]) { const x0 = Math.min(K.X(a), K.X(b)); qy(x0, x0 + (b - a), W, 1.22, 1.92, PAT.siding(st, 2)); lw([x0, W, 1.22], [x0 + b - a, W, 1.22], '#56636b'); lw([x0, W, 1.92], [x0 + b - a, W, 1.92], '#56636b'); }
        const r0 = Math.min(K.X(.5), K.X(1.1)); disc('y', r0 + .3, W, .74, .2, (a, b, d) => d > 2 ? '#2a2634' : '#e8c060');                                                  // hose reel
        // ladder on the roof
        const a = Math.min(K.X(.1), K.X(3.3)), b = a + 3.2; box(a, .5, 2.05, 3.2, .9, .1, '#8d939e', { ol: false });
        lw([a, .55, 2.3], [b, .55, 2.3], st); lw([a, 1.35, 2.3], [b, 1.35, 2.3], '#f6f2e6'); for (let x = a + .15; x < b; x += .3) lw([x, .55, 2.3], [x, 1.35, 2.3], st);
        lw([a, 1.35, 2.16], [b, 1.35, 2.16], st); for (let x = a; x <= b + .01; x += .8) lw([x, 1.35, 2.16], [x, 1.35, 2.3], st);
      }],
      [4.8, () => {
        K.body([[3.5, 2.2], [5.7, 2.2], [6.08, 1.5], [6.2, 1.44]], 0, W, zb, c);
        K.glassT(5.74, 2.12, 6.04, 1.58, .12, W - .12); K.glassY([[5.0, 1.5], [5.0, 2.04], [5.62, 2.04], [5.9, 1.5]], W); K.glassY([[3.85, 1.5], [3.85, 2.04], [4.75, 2.04], [4.75, 1.5]], W);
        K.rectY(3.5, 6.2, W, 1.0, 1.12, '#f6f2e6'); K.rectY(3.5, 6.2, W, 1.12, 1.16, '#f2c230'); K.doorLine(4.88, zb + .1, 2.1); K.doorLine(3.7, zb + .1, 2.1); K.handle(4.95, 1.32); K.handle(3.78, 1.32); K.mirror(5.95, 1.6);
        sideText(K, 'FIRE', 3.75, 4.85, .92, '#f6f2e6');
      }],
    ]);
    K.wheels([1.0, 1.85, 5.2], .42, { hub: st });
    if (K.f) K.end(zb, 1.44, { lz: .66, lh: .2, gz0: .98, gz1: 1.3, grillec: st, grille2: '#aab0ba', bumperc: st }); else { K.end(zb, 2.05, { lz: zb + .14, lw: .24, lh: .2, plate: false, bumperc: st }); qx(L, .2, W - .2, 1.2, 1.9, PAT.siding(dk(st, .2), 2)); qx(L, .1, W - .1, 1.0, 1.12, '#f6f2e6'); }
    K.markers(.76, .7);
    lightBar(K, 5.2, 2.2, '#ff3b3b', '#ff3b3b', p.siren !== false && !p.parked);
  }, { id: 'veh.truck.fire', vb: vbOf(6.2, 1.9, 2.9) }),

  V(8, 1.8, 2.4, ['bus'], [{ dir: 1, route: '12', dest: 'HARBOR' }, { dir: -1, route: '7', dest: 'HILLCREST' }, { dir: 1, route: '3', dest: 'AIRPORT', color: '#2f7fa8' }], p => drawBus(p, false), { id: 'veh.bus', vb: vbOf(8, 1.8, 2.8) }),
  V(8, 1.8, 3.8, ['bus', 'doubledecker'], [{ dir: 1, route: '1', dest: 'CITY TOUR', color: '#c9382e' }, { dir: -1, route: '12', dest: 'HARBOR' }], p => drawBus(p, true), { id: 'veh.bus.double', vb: vbOf(8, 1.8, 4.2) }),
];
