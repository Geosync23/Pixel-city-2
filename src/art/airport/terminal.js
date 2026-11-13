// Maple Bay International — terminal modules (street side = +y face), drop-off canopy, jet bridge, flight board.
// Snap rule (unflipped): all modules share the same +y facade line. hall is 10 deep, wing/endcap are 8 deep:
//   wing.y = hall.y + 2 ; wing.x = hall.x + hall.w (or hall.x - wing.w) ; endcap.x = wing.x + wing.w, endcap.y = wing.y.
import { box, qy, qx, qz, lw, fq, lit, glow, dk, lt, rng, winY, winX, PAT, spx } from '../../engine/raster.js';
import { AP, SNOW, winter, wtext, tw, bsignY, bsignX, bmp, LEAF, extrudeX, gableX, arcWall, curtainY, curtainX, glassDoorY, lamp, snowTop, loft } from './_lib.js';

const ROOFC = '#eef0ee', NAVY = '#1f3554', WARM = '#ffd98a';

/** swooping roof: profile from the front eave (yF) over the peak to the back (yB) */
function waveProf(yF, yB, zb, rise, pk, n) { const a = []; for (let i = 0; i <= n; i++) { const t = i / n; a.push([yF + (yB - yF) * t, zb + rise * Math.sin(Math.PI * Math.pow(t, pk))]); } return a; }
function glassRoof(prof, x0, x1, g0, g1, bay) {
  const snow = winter(), nb = Math.round((x1 - x0) / bay), bw = (x1 - x0) / nb;
  const gc = k => ['#5fa3c0', '#6fb4cf', '#86c2d8', '#9fd0e2', '#b4dcea', '#c6e6f0'][Math.max(0, Math.min(5, k - g0 + (g1 - g0 < 3 ? 2 : 0)))];
  extrudeX(prof, x0, x1, { ol: false, col: k => snow && k > g1 ? SNOW : ROOFC });
  for (let b = 0; b < nb; b++) {
    const xa = x0 + b * bw + .14, xb = x0 + (b + 1) * bw - .14;
    extrudeX(prof, xa, xb, { ol: false, flat: true, col: k => k >= g0 && k <= g1 ? gc(k + ((b * 7 + k * 3) % 5 === 0 ? 1 : 0)) : null, h2: k => snow && k >= g1 - 1 ? SNOW : undefined });
    glow(() => extrudeX(prof, xa, xb, { ol: false, flat: true, col: k => k >= g0 && k <= g1 ? ((b + k) % 4 === 0 ? '#ffe9b0' : WARM) : null, h2: k => (b * 3 + k) % 5 === 1 ? '#f4c870' : '#e0a95a' }));
    const xm = (xa + xb) / 2; for (let k = g0; k <= g1; k++) lw([xm, prof[k][0], prof[k][1]], [xm, prof[k + 1][0], prof[k + 1][1]], '#e4f1f5');
  }
  for (let k = g0; k <= g1 + 1; k++) lw([x0, prof[k][0], prof[k][1]], [x1, prof[k][0], prof[k][1]], k === g0 || k === g1 + 1 ? dk(ROOFC, .2) : '#e4f1f5');
  extrudeX(prof, x0, x1, { nofill: true, col: () => ROOFC, ol: dk(ROOFC, .62) });
  lw([x0, prof[0][0], prof[0][1]], [x1, prof[0][0], prof[0][1]], dk(ROOFC, .62));
}
function endGlass(prof, x, zb) {
  gableX(prof, x, zb, AP.glassD, '#5fa3c0'); glow(() => gableX(prof, x, zb, '#f4c870', '#e8b860'));
  for (let i = 1; i < prof.length - 1; i++) lw([x, prof[i][0], zb], [x, prof[i][0], prof[i][1]], '#46526a');
  lw([x, prof[0][0], zb], [x, prof[prof.length - 1][0], zb], '#46526a');
}
function pilaster(x, y, z0, z1, w = .35) { box(x, y - .05, z0, w, .2, z1 - z0, '#f4f2ea', { ol: false }); lw([x, y + .15, z0], [x, y + .15, z1], dk(AP.wall, .35)); }
/** ground-floor storefront glazing between x0..x1 with optional doors (array of centre x) */
function groundGlass(x0, x1, y, doors, z1 = 2.2) {
  qy(x0, x1, y, 0, .35, PAT.stone(dk(AP.conc, .1)));
  const n = Math.max(1, Math.round((x1 - x0) / 1.25)), s = (x1 - x0) / n;
  for (let i = 0; i < n; i++) { const a = x0 + i * s, b = a + s; if (doors.some(dx => dx > a - .9 && dx < b + .9)) continue; winY(a + .04, b - .04, y, .35, z1, { on: true, glass: i % 3 ? [AP.glassA, '#7fbfd6'] : ['#93cce0', '#a9d8e8'], frame: '#55627a', mullion: 'h' }); }
  for (const dx of doors) { qy(dx - 1.25, dx + 1.25, y, .0, z1, '#dfe3e6'); winY(dx - 1.2, dx - .95, y, .1, z1 - .1, { on: true }); winY(dx + .95, dx + 1.2, y, .1, z1 - .1, { on: true }); glassDoorY(dx, y, 1.7, 1.8); }
}
function flightBoard(x0, x1, y, z0, z1, title, seed) {
  const r = rng(seed), dest = ['OSAKA', 'LISBON', 'CAIRO', 'OSLO', 'LIMA', 'PARIS', 'SEOUL', 'ROME', 'DUBLIN', 'HAVANA', 'BERGEN', 'KYOTO'], rows = Math.floor(((z1 - z0) * 16 - 10) / 7);
  lit(() => {
    qy(x0, x1, y, z0, z1, '#141c2b'); qy(x0, x1, y, z1 - .45, z1, '#27456b');
    wtext('y', title, x0 + .15, y, z1 - .1, '#ffd24a');
    for (let i = 0; i < rows; i++) {
      const z = z1 - .58 - i * (7 / 16), t = String(6 + i + Math.floor(r() * 3)).padStart(2, '0') + String(Math.floor(r() * 6) * 10).padStart(2, '0'), dn = dest[Math.floor(r() * dest.length)], late = r() < .25;
      wtext('y', t, x0 + .15, y, z, '#f4f8fb'); wtext('y', dn, x0 + .15 + 20 / 16, y, z, '#ffb84a');
      const g = 'ABC'[Math.floor(r() * 3)] + (1 + Math.floor(r() * 8)); if ((x1 - x0) * 16 > 62) wtext('y', g, x0 + .15 + 48 / 16, y, z, '#8fe0ff');
      if ((x1 - x0) * 16 > 74) wtext('y', late ? 'LATE' : 'GO', x1 - .15 - tw(late ? 'LATE' : 'GO') / 16, y, z, late ? '#ff5a4a' : '#6dff8a');
    }
  });
  lw([x0, y, z0], [x1, y, z0], '#55627a'); lw([x0, y, z1], [x1, y, z1], '#55627a'); lw([x0, y, z0], [x0, y, z1], '#55627a'); lw([x1, y, z0], [x1, y, z1], '#55627a');
}
function roofClutter(x, y, z, r) {
  box(x, y, z, 1.2, .9, .6, '#b9c2c9'); qy(x + .15, x + 1.05, y + .9, z + .12, z + .48, PAT.siding('#7c8792', 2));
  if (r() < .6) { box(x + 1.8, y + .2, z, .5, .5, .9, '#9aa7b4'); }
}

/* ---------- central hall ---------- */
function hall(p) {
  const w = p.w || 16, d = 10, H = 6, r = rng(p.seed || 1), name = p.name || 'MAPLE BAY INTL';
  box(0, 0, 0, w, d, H, AP.wall);
  // +x end wall
  qx(w, 0, d, 0, .35, PAT.stone(dk(AP.conc, .25)));
  curtainX(w, .7, d - .7, 3.0, 4.9, { sx: 1.08, sz: .95 });
  qx(w, 0, d, 2.3, 2.9, dk(NAVY, .2)); qx(w, 0, d, 5.0, 6.0, dk(NAVY, .2));
  for (let y = 1; y + 1.6 < d; y += 2.9) { qx(w, y, y + 1.7, .55, 2.05, '#2a3140'); lit(() => { qx(w, y + .08, y + 1.62, .63, 1.97, ['#f08a2c', '#2f8f8a', '#c93f7a'][Math.floor(r() * 3)]); wtext('x', ['FLY', 'BAY', 'GO!'][Math.floor(r() * 3)], w, y + 1.3, 1.5, '#fff8e0'); }); }
  bsignX('TERMINAL 1', w, d / 2 - 2, d / 2 + 2, 5.15, 5.85, null, '#f4f8fb', { lit: true });
  // +y facade (street side)
  const y = d, dA = 4, dB = w - 4, mid = w / 2;
  groundGlass(.4, w - .4, y, [dA, dB]);
  curtainY(.5, w - .5, y, 3.0, 4.9, { sx: 1.07, sz: .95 });
  for (let x = 0; x <= w - .3; x += (w - .35) / Math.round(w / 4)) pilaster(x, y, 0, 5.0);
  // info wall between the doors
  if (dB - dA > 6) { qy(mid - 1.6, mid + 1.6, y, .35, 2.2, '#dfe3e6'); flightBoard(mid - 1.4, mid + 1.4, y + .01, .75, 2.05, 'ARRIVALS', (p.seed || 1) + 5); }
  qy(0, w, y, 2.3, 2.9, NAVY); lw([0, y, 2.3], [w, y, 2.3], '#6fb4cf'); lw([0, y, 2.9], [w, y, 2.9], dk(NAVY, .4));
  bsignY('ARRIVALS', dA - 1.9, dA + 1.9, y + .01, 2.36, 2.84, '#f2c230', '#1b2233', { lit: true });
  bsignY('DEPARTURES', dB - 1.9, dB + 1.9, y + .01, 2.36, 2.84, '#2f7fd0', '#ffffff', { lit: true });
  lit(() => { for (const dx of [dA, dB]) { wtext('y', 'v', dx - 2.3, y + .01, 2.76, '#ffffff'); wtext('y', 'v', dx + 2.12, y + .01, 2.76, '#ffffff'); } });
  flightBoard(mid - 2.6, mid + 2.6, y + .01, 3.2, 4.75, 'DEPARTURES   GATE', (p.seed || 1) + 9);
  // top fascia with the big illuminated name
  qy(0, w, y, 5.0, 6.0, NAVY); lw([0, y, 5.0], [w, y, 5.0], '#6fb4cf');
  const k = w >= 12 ? 2 : 1, tx = mid - tw(name, k) / 32 + (k === 2 ? .45 : .3);
  lit(() => { wtext('y', name, tx, y + .01, 5.5 + 5 * k / 32, '#fff8e0', k); bmp('y', LEAF, tx - (k === 2 ? 1.45 : .8), y + .01, 5.5 + 9 * k / 32, { '#': '#ff5a4a' }, k); });
  glow(() => { lw([0, y, 5.02], [w, y, 5.02], '#bfe4ee'); });
  // roof
  const prof = waveProf(d + .35, -.3, 6.15, 2.9, 1.5, 14);
  box(-.2, -.2, 6, w + .4, d + .4, .15, ROOFC, { ol: false });
  endGlass(prof, w, 6.15);
  glassRoof(prof, -.3, w + .3, 2, 7, 2);
  lamp(w / 2, prof[9][0], prof[9][1] + .1, '#ff4a3a');
}

/* ---------- wing ---------- */
function wing(p) {
  const w = p.w || 12, d = 8, H = 4.2, r = rng(p.seed || 2), name = p.name || 'GATES A1-A8';
  box(0, 0, 0, w, d, H, AP.wall);
  qx(w, 0, d, 0, .35, PAT.stone(dk(AP.conc, .25)));
  curtainX(w, .6, d - .6, 2.8, 3.85, { sx: 1.1, sz: 1.05 }); curtainX(w, 1.6, d - 1.6, .5, 2.1, { sx: 1.2, sz: 1.6 });
  qx(w, 0, d, 2.2, 2.7, dk('#f4f2ea', .3)); qx(w, 0, d, 2.28, 2.4, dk(AP.sky, .3));
  const y = d, nb = Math.max(1, Math.round(w / 4)), bw = w / nb, doors = [];
  for (let b = 0; b < nb; b += 2) doors.push(2 + b * bw > w - 1.5 ? w / 2 : 2 + b * bw);
  groundGlass(.3, w - .3, y, doors);
  curtainY(.4, w - .4, y, 2.8, 3.85, { sx: 1.0, sz: 1.05, on: (i) => r() < .9 });
  for (let b = 0; b <= nb; b++) pilaster(Math.min(b * bw, w - .35), y, 0, 3.9);
  qy(0, w, y, 2.2, 2.7, '#f4f2ea'); qy(0, w, y, 2.28, 2.4, AP.sky);
  doors.forEach((dx, i) => { const t = (p.signs || ['CHECK-IN', 'BAGGAGE', 'GATES', 'TICKETS'])[i % 4]; bsignY(t, dx - 1.3, dx + 1.3, y + .01, 2.22, 2.68, i % 2 ? '#2f7fd0' : NAVY, '#ffffff', { lit: true }); });
  qy(0, w, y, 3.9, 4.2, '#f4f2ea'); lw([0, y, 3.9], [w, y, 3.9], dk(AP.wall, .3));
  qy(0, w, y, 3.9, 4.32, '#f4f2ea'); if (w >= 8) wtext('y', name, w - .5 - tw(name) / 16, y + .01, 4.23, NAVY);
  const prof = waveProf(d + .08, -.3, 4.36, 1.0, 1.25, 8);
  box(-.15, -.15, H, w + .3, d + .3, .12, ROOFC, { ol: false });
  endGlass(prof, w, 4.36);
  glassRoof(prof, -.25, w + .25, 2, 3, 2);
}

/* ---------- rounded end cap ---------- */
function endcap(p) {
  const d = 8, cx = 1, cy = 4, R = 4, A0 = -Math.PI / 2, A1 = Math.PI / 2, n = 14, arc = (a, rr) => [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
  const band = (z0, z1, col, o) => arcWall(cx, cy, R, A0, A1, z0, z1, col, Object.assign({ n }, o));
  const glassBand = (z0, z1) => { band(z0, z1, '#55627a', { flat: true }); band(z0 + .06, z1 - .06, i => i % 4 === 1 ? '#93cce0' : AP.glassA, { gap: .07 }); glow(() => band(z0 + .06, z1 - .06, i => i % 5 === 2 ? '#ffe9b0' : WARM, { gap: .07, flat: true })); };
  box(0, 0, 0, 1, d, 4.2, AP.wall, { ol: false });
  band(0, .35, dk(AP.conc, .1)); glassBand(.35, 2.2); band(2.2, 2.7, '#f4f2ea'); band(2.28, 2.4, AP.sky); glassBand(2.8, 3.85); band(3.85, 4.2, '#f4f2ea');
  qy(0, 1, d, 0, .35, PAT.stone(dk(AP.conc, .1))); winY(.1, .95, d, .35, 2.2, { on: true, frame: '#55627a', mullion: 'h' }); qy(0, 1, d, 2.2, 2.7, '#f4f2ea'); qy(0, 1, d, 2.28, 2.4, AP.sky); winY(.1, .95, d, 2.8, 3.85, { on: true, frame: '#55627a' }); qy(0, 1, d, 3.85, 4.2, '#f4f2ea');
  const top = (z, rr, c, cxx = cx, a0 = A0, a1 = A1, h2) => { const pts = []; for (let i = 0; i <= 16; i++) { const a = a0 + (a1 - a0) * i / 16; pts.push([cxx + rr * Math.cos(a), cy + rr * Math.sin(a), z]); } fq(pts, c, h2); };
  qz(0, 1, 0, d, 4.2, ROOFC); top(4.2, R, ROOFC); top(4.2, R - .35, '#d9dedf');
  if (winter()) { top(4.2, R - .4, SNOW, cx, A0, A1, 'glass'); top(4.2, R - .9, SNOW); }
  // outline of the drum
  const oc = dk(AP.wall, .7); for (let i = 0; i < 16; i++) { const a = -Math.PI / 4 + (Math.PI * .75) * i / 16, b = -Math.PI / 4 + (Math.PI * .75) * (i + 1) / 16; lw([...arc(a, R), 0], [...arc(b, R), 0], oc); }
  for (let i = 0; i < 16; i++) { const a = A0 + Math.PI * i / 16, b = A0 + Math.PI * (i + 1) / 16; lw([...arc(a, R), 4.2], [...arc(b, R), 4.2], i < 4 ? oc : '#fbfaf4'); }
  lw([...arc(-Math.PI / 4, R), 0], [...arc(-Math.PI / 4, R), 4.2], oc); lw([0, d, 0], [1, d, 0], oc); lw([0, d, 0], [0, d, 4.2], oc); lw([0, 0, 4.2], [1, 0, 4.2], oc); lw([0, 0, 4.2], [0, d, 4.2], oc);
  // sky lounge drum on the roof
  const lx = 2.6, lr = 1.9, full = (z0, z1, col, o) => arcWall(lx, cy, lr, -Math.PI, Math.PI, z0, z1, col, Object.assign({ n: 20 }, o));
  full(4.2, 4.45, '#f4f2ea'); full(4.45, 5.5, '#55627a', { flat: true }); full(4.5, 5.45, i => i % 3 === 0 ? '#93cce0' : AP.glassA, { gap: .08 }); glow(() => full(4.5, 5.45, () => '#ffe2a0', { gap: .08, flat: true }));
  arcWall(lx, cy, lr + .35, -Math.PI, Math.PI, 5.5, 5.75, '#f4f2ea', { n: 20 });
  top(5.75, lr + .35, winter() ? SNOW : ROOFC, lx, 0, Math.PI * 2); top(5.75, lr - .3, winter() ? SNOW : '#d9dedf', lx, 0, Math.PI * 2);
  for (let i = 0; i < 20; i++) { const a = -Math.PI / 4 + Math.PI * i / 20, b = -Math.PI / 4 + Math.PI * (i + 1) / 20; lw([lx + (lr + .35) * Math.cos(a), cy + (lr + .35) * Math.sin(a), 5.5], [lx + (lr + .35) * Math.cos(b), cy + (lr + .35) * Math.sin(b), 5.5], oc); }
  for (let i = 0; i < 24; i++) { const a = Math.PI * 2 * i / 24, b = Math.PI * 2 * (i + 1) / 24; lw([lx + (lr + .35) * Math.cos(a), cy + (lr + .35) * Math.sin(a), 5.75], [lx + (lr + .35) * Math.cos(b), cy + (lr + .35) * Math.sin(b), 5.75], (i >= 9 && i < 21) ? oc : '#fbfaf4'); }
  box(lx - .06, cy - .06, 5.75, .12, .12, 1.6, '#8a93a0', { ol: false }); lamp(lx, cy, 7.4, '#ff4a3a');
  bsignY(p.name || 'SKY LOUNGE', lx - 1.4, lx + 1.4, cy + lr + .4, 5.8, 6.25, NAVY, '#ffe9a8', { lit: true });
}

/* ---------- drop-off canopy ---------- */
const CAN_D = 4, pillarXs = w => { const n = Math.max(2, Math.round(w / 4)), a = []; for (let i = 0; i < n; i++) a.push(1 + i * (w - 2.4) / (n - 1)); return a; };
function pillar(x, y) {
  box(x - .05, y - .05, 0, .5, .5, .45, AP.conc); qy(x - .05, x + .45, y + .45, .1, .35, PAT.vstripes('#f2c230', '#2a2f3d', 3)); qx(x + .45, y - .05, y + .45, .1, .35, PAT.vstripes('#d9a520', '#2a2f3d', 3));
  box(x + .08, y + .08, .45, .24, .24, 2.75, '#e6e9ea'); lw([x + .2, y + .32, 3.2], [x - .5, y + .32, 3.55], '#8a93a0'); lw([x + .2, y + .32, 3.2], [x + .9, y + .32, 3.55], '#8a93a0');
  lw([x + .2, y + .2, 3.2], [x + .2, y - .9, 3.5], '#8a93a0');
}
function canopy(p) {
  const w = p.w || 12, d = CAN_D, z0 = 3.3, z1 = 3.75, zy = yy => z0 + (z1 - z0) * yy / d;
  if (p.pillars) for (const x of pillarXs(w)) pillar(x, 3.1);
  // underside lights
  for (let x = 1; x < w; x += 2) { glow(() => { fq([[x - .4, 1.6, zy(1.6) - .1], [x + .4, 1.6, zy(1.6) - .1], [x + .4, 2.4, zy(2.4) - .1], [x - .4, 2.4, zy(2.4) - .1]], '#fff2c4'); }); }
  // glass deck
  const nb = Math.round(w / 2), bw = w / nb;
  for (let b = 0; b < nb; b++) for (let j = 0; j < 2; j++) { const xa = b * bw, xb = xa + bw, ya = j * 2, yb = ya + 2; fq([[xa, ya, zy(ya)], [xb, ya, zy(ya)], [xb, yb, zy(yb)], [xa, yb, zy(yb)]], (b + j) % 2 ? '#cfeaf2' : '#a9d8e8', 'glass'); }
  if (winter()) fq([[0, .2, zy(.2)], [w, .2, zy(.2)], [w, 2.6, zy(2.6)], [0, 2.6, zy(2.6)]], SNOW, 'glass');
  const beam = '#f4f2ea', bo = dk('#e6e9ea', .6);
  for (let b = 0; b <= nb; b++) { const x = Math.min(b * bw, w); lw([x, 0, z0], [x, d, z1], beam); lw([x + 1 / 16, 0, z0], [x + 1 / 16, d, z1], '#c9d2d8'); }
  lw([0, 2, zy(2)], [w, 2, zy(2)], beam);
  // front edge beam (faces the street) with hanging lit signs
  fq([[0, d, z1 - .28], [w, d, z1 - .28], [w, d, z1 + .06], [0, d, z1 + .06]], dk('#e6e9ea', .18)); fq([[w, 0, z0 - .28], [w, d, z1 - .28], [w, d, z1 + .06], [w, 0, z0 + .06]], dk('#e6e9ea', .36));
  lw([0, d, z1 + .06], [w, d, z1 + .06], '#fbfaf4'); lw([0, d, z1 - .28], [w, d, z1 - .28], bo); lw([w, 0, z0 - .28], [w, d, z1 - .28], bo); lw([w, 0, z0 + .06], [w, d, z1 + .06], '#fbfaf4'); lw([0, d, z1 - .28], [0, d, z1 + .06], bo); lw([w, d, z1 - .28], [w, d, z1 + .06], bo); lw([0, 0, z0 + .04], [w, 0, z0 + .04], bo); lw([0, 0, z0 + .04], [0, d, z1 + .04], bo);
  lit(() => lw([0.1, d, z1 - .2], [w - .1, d, z1 - .2], '#8fe0ff'));
  const signs = p.signs || ['DROP-OFF', 'TAXI', 'BUS', 'PICK-UP'], cols = { TAXI: ['#f2c230', '#1b2233'], BUS: ['#2f7fd0', '#ffffff'], 'DROP-OFF': ['#1f3554', '#ffffff'], 'PICK-UP': ['#2f8f8a', '#ffffff'] };
  const ns = Math.max(1, Math.floor(w / 5));
  for (let i = 0; i < ns; i++) { const t = signs[i % signs.length], sw = tw(t) / 16 + .4, x = (i + .5) * w / ns - sw / 2, c = cols[t] || ['#1f3554', '#ffffff']; lw([x + .15, d, z1 - .28], [x + .15, d, z1 - .5], '#8a93a0'); lw([x + sw - .15, d, z1 - .28], [x + sw - .15, d, z1 - .5], '#8a93a0'); bsignY(t, x, x + sw, d, z1 - 1.0, z1 - .5, c[0], c[1], { lit: true }); }
}

/* ---------- jet bridge ---------- */
function jetbridge(p) {
  const L = p.len || 8, zf = 1.5, c = p.col || '#e6e9ea', ad = p.ad || AP.red;
  // rotunda on a column at the terminal end
  box(.55, .55, 0, .5, .5, zf, '#8a93a0'); box(.1, .1, zf, 1.4, 1.4, 2.0, c); qy(.3, 1.3, 1.5, zf + .7, zf + 1.5, AP.glassA); glow(() => qy(.3, 1.3, 1.5, zf + .7, zf + 1.5, WARM));
  if (winter()) qz(.2, 1.4, .2, 1.4, zf + 2.0, SNOW);
  // drive bogie under the outer tunnel
  const bx = L - 2.6; box(bx, .5, .5, .3, .6, zf - .5, '#f2c230'); box(bx - .5, .25, .15, 1.3, 1.1, .4, '#3d4654');
  for (const wx of [bx - .2, bx + .5]) { fq([[wx - .25, 1.36, .05], [wx + .25, 1.36, .05], [wx + .25, 1.36, .55], [wx - .25, 1.36, .55]], AP.tyre); spx(wx, 1.36, .3, 0, 0, '#aab0b8'); }
  // tunnels: inner (wider) + outer telescoping section
  const mid = Math.max(2.4, L * .5);
  box(1.5, .25, zf + .1, mid - 1.3, 1.1, 1.8, c, { l: PAT.planks(dk(c, .18), 5), t: winter() ? SNOW : undefined });
  box(mid, .15, zf, L - mid - 1.6, 1.3, 1.95, c, { t: winter() ? SNOW : undefined });
  for (let x = 1.8; x + .5 < mid; x += .9) winY(x, x + .5, 1.35, zf + .95, zf + 1.45, { on: true });
  { const sw = L - 2 - mid, nm = [p.name || 'MAPLE BAY', 'MAPLE', 'MB'].find(t => tw(t) / 16 < sw - .15) || ''; bsignY(nm, mid + .2, L - 1.8, 1.46, zf + .5, zf + 1.35, ad, '#ffffff', { lit: true }); }
  lw([mid, 1.45, zf + 1.6], [L - 1.6, 1.45, zf + 1.6], dk(c, .3));
  // cab with accordion hood facing the aircraft (+x end)
  box(L - 1.6, 0, zf - .05, 1.2, 1.6, 2.15, c, { t: winter() ? SNOW : undefined }); winY(L - 1.4, L - .7, 1.6, zf + .9, zf + 1.5, { on: true });
  box(L - .4, .1, zf, .4, 1.4, 2.0, '#3a3f4c', { r: PAT.vstripes('#2b2a35', '#4a4f5c', 2), l: PAT.vstripes('#3a3f4c', '#565c6a', 2) });
  qx(L, .35, 1.25, zf + .1, zf + 1.75, '#1d1c26'); glow(() => qx(L, .45, 1.15, zf + .2, zf + 1.65, '#f4c870'));
  lamp(L - 1, .8, zf + 2.15, '#ffb84a'); wtext('y', p.gate || 'A4', 2.0 - 1.2, 1.51, zf + 1.7, '#27456b');
}

/* ---------- free-standing flight information display ---------- */
function board(p) {
  const w = p.w || 3;
  box(.1, .1, 0, .2, .25, 2.5, '#55627a'); box(w - .3, .1, 0, .2, .25, 2.5, '#55627a'); box(0, 0, .9, w, .4, 1.7, '#2a3140');
  flightBoard(.12, w - .12, .41, 1.0, 2.5, p.title || 'DEPARTURES', p.seed || 3);
  lit(() => { qx(w, .05, .35, 1.0, 2.5, '#27456b'); });
  if (winter()) qz(0, w, 0, .4, 2.6, SNOW);
}

export default [
  { id: 'bld.airport.terminal.hall', kind: 'building', tags: ['airport', 'terminal', 'landmark'], size: p => [p.w || 16, 10, 6.2], vb: p => [-.6, -.6, 0, (p.w || 16) + .6, 10.7, 9.2],
    door: { side: 'y', at: 4 }, light: { x: 8, y: 11.5, z: 0, r: 7 },
    variants: [{ w: 16, seed: 1 }, { w: 20, seed: 4 }, { w: 12, seed: 7, name: 'MAPLE BAY' }], draw: hall },
  { id: 'bld.airport.terminal.wing', kind: 'building', tags: ['airport', 'terminal'], size: p => [p.w || 12, 8, 4.3], vb: p => [-.5, -.5, 0, (p.w || 12) + .5, 8.6, 5.7],
    door: { side: 'y', at: 2 }, light: { x: 2, y: 9.5, z: 0, r: 5 },
    variants: [{ w: 12, seed: 2 }, { w: 8, seed: 5, name: 'GATES B1-B6' }, { w: 20, seed: 8, name: 'INTERNATIONAL  C1-C12' }], draw: wing },
  { id: 'bld.airport.terminal.endcap', kind: 'building', tags: ['airport', 'terminal'], size: [5, 8, 4.3], vb: [-.3, -.3, 0, 5.4, 8.4, 7.8], variants: [{ seed: 1 }], draw: endcap },
  { id: 'prop.airport.canopy', kind: 'prop', solid: false, tags: ['airport', 'terminal', 'overhead'], size: p => [p.w || 12, CAN_D, 3.8], vb: p => [-.2, -.2, 0, (p.w || 12) + .2, CAN_D + .2, 4.1],
    light: { x: 6, y: 2, z: 0, r: 6 }, variants: [{ w: 12 }, { w: 16, pillars: true }, { w: 8, pillars: true, signs: ['TAXI'] }], draw: canopy },
  { id: 'prop.airport.canopy.pillar', kind: 'prop', solid: true, tags: ['airport', 'terminal'], size: [.5, .5, 3.3], vb: [-.8, -1.2, 0, 1.3, .8, 3.7], draw: () => pillar(.05, .05) },
  { id: 'prop.airport.jetbridge', kind: 'prop', solid: true, tags: ['airport', 'airside'], size: p => [p.len || 8, 1.6, 3.7], vb: p => [-.2, -.2, 0, (p.len || 8) + .2, 1.9, 4.2],
    variants: [{ len: 8, gate: 'A4' }, { len: 11, gate: 'B2', ad: '#2f8f8a', name: 'FLY BAYJET' }, { len: 6, gate: 'C1', ad: '#27456b', name: 'GATE C1' }], draw: jetbridge },
  { id: 'prop.airport.board', kind: 'prop', solid: true, tags: ['airport', 'terminal', 'sign'], size: p => [p.w || 3, .4, 2.6], variants: [{ w: 3, seed: 3 }, { w: 5, seed: 6, title: 'ARRIVALS    BELT' }], light: { x: 1.5, y: 1.2, z: 0, r: 2.5 }, draw: board },
];
export { pillarXs, CAN_D };
