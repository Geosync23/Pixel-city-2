// Airport buildings: control tower, hangars, cargo, fire/rescue, fuel farm, radar dome, car park, hotel, car rental, taxi shelter.
import { box, qy, qx, qz, lw, fq, lit, glow, dk, lt, mix, rng, winY, winX, PAT, spx, cyl, ball, gable, signY, signX } from '../../engine/raster.js';
import { AP, SNOW, winter, wtext, tw, bsignY, bsignX, bmp, LEAF, extrudeY, gableY, arcWall, curtainY, curtainX, glassDoorY, lamp, snowTop, discZ, discY, sideCar, loft, shade } from './_lib.js';

const NAVY = '#1f3554', WARM = '#ffd98a';
const circ = (cx, cy, r, z, a0, a1, col, n = 24) => { for (let i = 0; i < n; i++) { const a = a0 + (a1 - a0) * i / n, b = a0 + (a1 - a0) * (i + 1) / n; lw([cx + r * Math.cos(a), cy + r * Math.sin(a), z], [cx + r * Math.cos(b), cy + r * Math.sin(b), z], col); } };
const VIS0 = -Math.PI / 4, VIS1 = Math.PI * .75;
function acUnit(x, y, z) { box(x, y, z, 1.1, .8, .55, '#b9c2c9'); qy(x + .12, x + .98, y + .8, z + .1, z + .45, PAT.siding('#7c8792', 2)); }
function door(x, y, c = '#3d4654') { qy(x - .5, x + .5, y, 0, 1.7, dk(c, .3)); qy(x - .42, x + .42, y, 0, 1.62, c); winY(x - .28, x + .28, y, .9, 1.4, { on: true }); spx(x + .32, y, .8, 0, 0, '#e8e2d4'); }

/* ---------- control tower ---------- */
function tower(p) {
  const hs = p.h || 11, cx = 3, cy = 3, r = rng(p.seed || 1), wall = p.wall || '#e4e2da', acc = p.accent || AP.red, zt = 2.2 + hs;
  box(0, 0, 0, 6, 6, 2.2, wall, { l: PAT.stucco(dk(wall, .18)), r: PAT.stucco(dk(wall, .36)) });
  qy(0, 6, 6, 0, .3, PAT.stone(dk(AP.conc, .15))); qx(6, 0, 6, 0, .3, PAT.stone(dk(AP.conc, .3)));
  qy(0, 6, 6, 1.75, 2.0, NAVY); qx(6, 0, 6, 1.75, 2.0, dk(NAVY, .2));
  door(1.1, 6); for (let x = 2.2; x < 5.4; x += 1.2) winY(x, x + .8, 6, .7, 1.5, { on: r() < .7, mullion: 'v', sill: true });
  for (let y = .6; y < 5.2; y += 1.2) winX(6, y, y + .8, .7, 1.5, { on: r() < .6, mullion: 'v', sill: true });
  lit(() => wtext('y', 'TOWER', 3.2, 6.01, 1.98, '#ffe9a8'));
  qz(.15, 5.85, .15, 5.85, 2.2, '#c9c7bd'); snowTop(.1, 5.9, .1, 5.9, 2.21); acUnit(.4, 4.6, 2.2); box(4.6, .5, 2.2, .9, .9, .8, '#9aa7b4');
  // shaft
  cyl(cx, cy, 2.2, 1.25, hs, '#e9e7df', { l: '#d9d7cf', r: '#b9b7b6', t: '#c9c7bd' });
  const full = (rr, z0, z1, col, o) => arcWall(cx, cy, rr, -Math.PI, Math.PI, z0, z1, col, Object.assign({ n: 24 }, o));
  full(1.27, zt - 1.2, zt - .5, acc); full(1.27, zt - 2.4, zt - 1.7, acc); full(1.27, 2.2, 2.6, dk(AP.conc, .1));
  for (let z = 3.4; z < zt - 3; z += 1.5) { for (const a of [Math.PI / 2 - .25, .35]) { const X = cx + 1.26 * Math.cos(a), Y = cy + 1.26 * Math.sin(a); lw([X, Y, z], [X, Y, z + .7], '#4a5a70'); spx(X, Y, z, 1, 0, '#4a5a70'); spx(X, Y, z + .35, 1, 0, '#6fb4cf'); if (r() < .6) glow(() => { lw([X, Y, z + .1], [X, Y, z + .6], WARM); }); } }
  lamp(cx + 1.28 * Math.cos(.9), cy + 1.28 * Math.sin(.9), 2.2 + hs * .5, '#ff4a3a');
  // flared collar + walkway
  full(1.27, zt, zt + .9, '#d9d7cf', { r1: 2.5 });
  discZ(cx, cy, zt + .9, 2.5, '#b9b7b6', null, 24); circ(cx, cy, 2.5, zt + .9, VIS0, VIS1, dk(wall, .7)); circ(cx, cy, 2.5, zt + 1.25, VIS0, VIS1, '#55627a');
  for (let i = 0; i <= 8; i++) { const a = VIS0 + (VIS1 - VIS0) * i / 8; lw([cx + 2.5 * Math.cos(a), cy + 2.5 * Math.sin(a), zt + .9], [cx + 2.5 * Math.cos(a), cy + 2.5 * Math.sin(a), zt + 1.25], '#55627a'); }
  // glass cab (outward-leaning panes)
  full(1.9, zt + .9, zt + 1.25, '#f4f2ea');
  full(1.9, zt + 1.25, zt + 2.75, '#3d4654', { r1: 2.4, flat: true });
  full(1.9, zt + 1.3, zt + 2.7, i => i % 3 === 0 ? '#a9d8e8' : '#6fb4cf', { r1: 2.4, gap: .09 });
  glow(() => full(1.9, zt + 1.3, zt + 2.7, i => i % 4 === 1 ? '#bff5e0' : '#8fe6d0', { r1: 2.4, gap: .09, flat: true }));
  full(2.5, zt + 2.75, zt + 3.0, '#f4f2ea');
  discZ(cx, cy, zt + 3.0, 2.5, winter() ? SNOW : '#e9e7df', null, 24); discZ(cx, cy, zt + 3.0, 2.0, winter() ? SNOW : '#d2d0c8', null, 24);
  circ(cx, cy, 2.5, zt + 3.0, 0, Math.PI * 2, '#fbfaf4'); circ(cx, cy, 2.5, zt + 2.75, VIS0, VIS1, dk(wall, .7)); circ(cx, cy, 2.5, zt + 3.0, VIS1, VIS0 + Math.PI * 2, dk(wall, .7));
  lit(() => { for (let i = 0; i < 6; i++) { const a = VIS0 + .2 + (VIS1 - VIS0 - .4) * i / 5; spx(cx + 2.5 * Math.cos(a), cy + 2.5 * Math.sin(a), zt + 2.88, 0, 0, '#8fe0ff'); } });
  // radar + antennas + beacon
  const zr = zt + 3.0;
  box(cx - .3, cy - .3, zr, .6, .6, .5, '#8a93a0'); box(cx - .07, cy - .07, zr + .5, .14, .14, .7, '#6b7482', { ol: false });
  const rd = [[cx - 1.3, cy + .5, zr + 1.0], [cx + 1.1, cy - .9, zr + 1.0], [cx + 1.25, cy - .75, zr + 1.75], [cx - 1.15, cy + .65, zr + 1.75]];
  fq(rd, PAT ? '#f08a2c' : '', '#f4f2ea'); for (let i = 0; i < 4; i++) lw(rd[i], rd[(i + 1) % 4], '#8a4a1c'); lw([cx - .1, cy - .1, zr + 1.0], [cx - .1, cy - .1, zr + 1.75], '#8a4a1c');
  lw([cx + 1.6, cy + 1.2, zr], [cx + 1.6, cy + 1.2, zr + 2.2], '#55627a'); lw([cx - 1.4, cy + 1.6, zr], [cx - 1.4, cy + 1.6, zr + 1.5], '#55627a'); lw([cx + .9, cy + 1.9, zr], [cx + .9, cy + 1.9, zr + 1.1], '#55627a');
  lamp(cx + 1.6, cy + 1.2, zr + 2.25, '#ff4a3a', true); lamp(cx - 1.4, cy + 1.6, zr + 1.55, '#ffffff');
}

/* ---------- hangars ---------- */
function hangarDoors(x0, x1, y, zt, c, open, n) {
  const pw = (x1 - x0) / n, mid = (x0 + x1) / 2;
  qy(x0, x1, y, 0, zt, '#232836'); glow(() => qy(mid - open, mid + open, y, 0, zt, '#f4c870', '#e0a95a'));
  if (open > .5) { // aircraft nose peeking out
    discY(mid, y - .01, 1.75, Math.min(open - .15, 1.0), '#f3f2ec'); discY(mid, y - .01, 1.55, Math.min(open - .15, 1.0) * .86, '#d3d6dc'); discY(mid, y - .01, 1.9, Math.min(open - .15, 1.0) * .9, '#f3f2ec');
    qy(mid - .5, mid + .5, y, 1.95, 2.25, '#27344e'); lw([mid, y, 1.95], [mid, y, 2.25], '#8fb4d0'); lw([mid - .02, y, .75], [mid - .02, y, .3], '#7c8592'); qy(mid - .15, mid + .15, y, 0, .4, '#1d1c26');
  }
  for (let i = 0; i < n; i++) {
    let a = x0 + i * pw, b = a + pw; const cxp = (a + b) / 2;
    if (cxp > mid - open && cxp < mid + open) continue;
    qy(a, b, y, 0, zt, PAT.planks(c, 4)); winY(a + .25, b - .25, y, zt * .52, zt * .52 + .5, { on: false, frame: dk(c, .5) });
    qy(a, b, y, 0, .3, PAT.vstripes('#f2c230', '#2a2f3d', 3)); lw([a, y, 0], [a, y, zt], dk(c, .55)); lw([b, y, 0], [b, y, zt], dk(c, .55));
  }
  lw([x0, y, zt], [x1, y, zt], dk(c, .6));
}
function hangarArch(p) {
  const w = p.w || 12, d = p.d || 10, c = p.col || '#9fb7b0', r = rng(p.seed || 1), zw = 1.6, rise = p.rise || 3.9, n = 14, snow = winter();
  const prof = []; for (let i = 0; i <= n; i++) { const a = Math.PI * i / n; prof.push([w / 2 + w / 2 * Math.cos(a), zw + rise * Math.sin(a)]); }
  // +x side wall
  box(0, 0, 0, w, d, zw, c, { l: PAT.planks(dk(c, .18), 4), r: PAT.planks(dk(c, .36), 4) });
  for (let y = 1; y + 1 < d; y += 2.2) winX(w, y, y + 1.1, .6, 1.2, { on: r() < .5, mullion: 'v' });
  // barrel roof in corrugated bays
  const nb = Math.round(d), bw = d / nb;
  for (let b = 0; b < nb; b++) extrudeY(prof, b * bw, (b + 1) * bw, { ol: false, col: k => snow && k >= 4 && k <= 9 ? SNOW : (b % 2 ? c : lt(c, .12)), h2: k => snow && (k === 3 || k === 10) ? SNOW : undefined });
  for (let b = 2; b < nb; b += 3) { extrudeY(prof, b * bw + .2, (b + 1) * bw - .2, { ol: false, flat: true, col: k => k >= 3 && k <= 4 ? '#93cce0' : null }); glow(() => extrudeY(prof, b * bw + .2, (b + 1) * bw - .2, { ol: false, flat: true, col: k => k >= 3 && k <= 4 ? WARM : null })); }
  extrudeY(prof, 0, d, { nofill: true, col: () => c, ol: dk(c, .7) });
  // front arch wall + doors
  const fc = lt(c, .25); gableY(prof, d, 0, dk(fc, .18));
  const zt = Math.min(zw + rise - 1.4, 4.2), dx0 = w / 2 - Math.min(w / 2 - 1.2, w * .36), dx1 = w - dx0;
  hangarDoors(dx0, dx1, d + .01, zt, p.door || '#dfe3e6', p.open === undefined ? 1.3 : p.open, Math.max(4, Math.round((dx1 - dx0) / 1.6)));
  for (let i = 0; i < n; i++) lw([prof[i][0], d, prof[i][1]], [prof[i + 1][0], d, prof[i + 1][1]], dk(c, .7)); lw([0, d, 0], [w, d, 0], dk(c, .7));
  bsignY(p.name || 'HANGAR 1', w / 2 - 2, w / 2 + 2, d + .02, zt + .25, zt + .85, NAVY, '#ffe9a8', { lit: true });
  bmp('y', LEAF, w / 2 - 9 / 32, d + .02, Math.min(zw + rise - .15, zt + 1.75), { '#': p.logo || AP.red });
  door(.7, d, '#55627a'); lamp(w / 2, d, zw + rise + .05, '#ff4a3a');
  glow(() => { for (const x of [dx0 + .3, w / 2, dx1 - .4]) { spx(x, d + .02, zt + .12, 0, 0, '#fff2c4'); spx(x, d + .02, zt + .12, 1, 0, '#fff2c4'); } });
}
function hangarBox(p) {
  const w = p.w || 14, d = p.d || 9, H = p.h || 4.4, c = p.col || '#7f9cc0', r = rng(p.seed || 1), aw = 3;
  // main shed (gable, ridge along y) + office annex on the +x side
  const mw = w - aw;
  box(0, 0, 0, mw, d, H, c, { l: PAT.planks(dk(c, .18), 4), r: PAT.planks(dk(c, .36), 4) });
  qy(0, mw, d, H - .9, H - .5, dk('#f4f2ea', .18)); qx(mw, 0, d, H - .9, H - .5, dk('#f4f2ea', .36));
  hangarDoors(.8, mw - .8, d + .01, H - 1.1, p.door || '#e6e9ea', p.open === undefined ? 0 : p.open, Math.max(3, Math.round((mw - 1.6) / 1.8)));
  gable(0, 0, H, mw, d, 1.3, 'y', winter() ? SNOW : '#c9d2d8', { wall: c, over: .2 });
  for (const y of [d * .25, d * .6]) box(mw / 2 - .3, y, H + 1.2, .6, 1.2, .3, '#8a93a0');
  bsignY(p.name || 'MAPLE AIR TECHNICS', mw / 2 - Math.min(mw / 2 - .6, 3.4), mw / 2 + Math.min(mw / 2 - .6, 3.4), d + .02, H - .98, H - .42, '#f4f2ea', p.ink || NAVY, { lit: true });
  bmp('y', LEAF, mw / 2 - 9 / 32, d + .02, H + .95, { '#': p.logo || AP.red });
  // annex
  const ah = 3.0;
  box(mw, d - 5, 0, aw, 5, ah, '#e4e2da', { l: PAT.stucco(dk('#e4e2da', .18)), r: PAT.stucco(dk('#e4e2da', .36)) });
  qy(mw, w, d, 0, .3, dk(AP.conc, .2)); qy(mw, w, d, ah - .3, ah, dk(c, .18)); qx(w, d - 5, d, ah - .3, ah, dk(c, .36));
  door(mw + .8, d); winY(mw + 1.5, mw + 2.7, d, .7, 1.4, { on: r() < .7, mullion: 'v', sill: true }); winY(mw + .4, mw + 2.7, d, 1.8, 2.5, { on: r() < .7, mullion: 'v', sill: true });
  for (let y = d - 4.5; y + 1 < d; y += 1.5) { winX(w, y, y + 1, .7, 1.4, { on: r() < .5, mullion: 'v', sill: true }); winX(w, y, y + 1, 1.8, 2.5, { on: r() < .6, mullion: 'v', sill: true }); }
  qz(mw + .15, w - .15, d - 4.85, d - .15, ah, '#c9c7bd'); snowTop(mw + .1, w - .1, d - 4.9, d - .1, ah + .01); acUnit(mw + .5, d - 4.2, ah);
  lw([mw + 2.4, d - 1, ah], [mw + 2.4, d - 1, ah + 1.6], '#55627a'); lamp(mw + 2.4, d - 1, ah + 1.65, '#ff4a3a');
}

/* ---------- cargo building with sawtooth roof ---------- */
function cargo(p) {
  const w = p.w || 14, d = p.d || 8, H = 3.6, c = p.col || '#d9d2c0', r = rng(p.seed || 1), acc = p.accent || '#5b3f8c';
  box(0, 0, 0, w, d, H, c, { l: PAT.planks(dk(c, .18), 5), r: PAT.planks(dk(c, .36), 5) });
  qy(0, w, d, 0, .75, PAT.stone(dk(AP.conc, .15))); qx(w, 0, d, 0, .75, PAT.stone(dk(AP.conc, .32)));
  qy(0, w, d, H - .8, H - .2, acc); qx(w, 0, d, H - .8, H - .2, dk(acc, .2));
  // loading docks
  const nd = Math.max(2, Math.floor((w - 1) / 2.4)), dw = (w - 1) / nd;
  for (let i = 0; i < nd; i++) {
    const x = .5 + i * dw + (dw - 1.7) / 2, open = r() < .3;
    qy(x - .12, x + 1.82, d, .75, 2.5, '#55627a'); qy(x, x + 1.7, d, .75, 2.4, open ? '#232836' : PAT.siding('#eef0ee', 2));
    if (open) { glow(() => qy(x, x + 1.7, d, .75, 2.4, '#f4c870', '#c9924a')); box(x + .2, d - .5, .75, .7, .5, .7, '#b98a52', { ol: false }); box(x + .95, d - .5, .75, .6, .5, .5, '#c9a36a', { ol: false }); }
    qy(x - .12, x + .05, d, .35, .75, '#2a2f3d'); qy(x + 1.65, x + 1.82, d, .35, .75, '#2a2f3d');
    lit(() => wtext('y', String(i + 1), x + .75, d + .01, 2.8, '#ffe9a8'));
    glow(() => { spx(x + .85, d + .01, 2.52, 0, 0, '#fff2c4'); spx(x + .85, d + .01, 2.52, 1, 0, '#fff2c4'); });
  }
  box(.2, d, 2.95, w - .4, .9, .1, '#8a93a0'); if (winter()) qz(.25, w - .45, d + .05, d + .85, 3.06, SNOW);
  bsignY(p.name || 'MAPLE BAY CARGO', w / 2 - 3.6, w / 2 + 3.6, d + .02, H - .78, H - .22, null, '#ffffff', { lit: true });
  for (let y = 1; y + 1.2 < d; y += 2.4) winX(w, y, y + 1.2, 1.4, 2.2, { on: r() < .5, mullion: 'v', sill: true });
  bsignX('BAY ' + (p.bay || 'C'), w, d / 2 - 1.2, d / 2 + 1.2, H - .78, H - .22, null, '#ffffff', { lit: true });
  // sawtooth roof: teeth run along y, glazed face toward +x
  const nt = Math.max(2, Math.round(w / 3)), tw_ = w / nt, th = 1.1, rc = winter() ? SNOW : '#b9c2c9';
  for (let i = 0; i < nt; i++) {
    const x0 = i * tw_, x1 = x0 + tw_ - .05;
    fq([[x0, 0, H], [x1, 0, H + th], [x1, d, H + th], [x0, d, H]], i % 2 ? rc : lt(rc, .2));
    fq([[x0, d, H], [x1, d, H], [x1, d, H + th]], dk(c, .22));
    qx(x1, 0, d, H, H + th, '#55627a'); const np = Math.round(d / 1.3);
    for (let j = 0; j < np; j++) winX(x1, j * d / np + .1, (j + 1) * d / np - .1, H + .15, H + th - .12, { on: r() < .75 });
    lw([x0, d, H], [x1, d, H + th], dk(c, .7)); lw([x1, 0, H + th], [x1, d, H + th], '#fbfaf4'); lw([x0, 0, H], [x1, 0, H + th], dk(c, .7)); lw([x1, d, H], [x1, d, H + th], dk(c, .7));
  }
  // air-cargo containers on the dock apron corner
}

/* ---------- fire & rescue ---------- */
function fire(p) {
  const w = p.w || 10, d = 6, H = 3.4, c = '#c94436', r = rng(p.seed || 1), tx = w - 1.8;
  box(0, 0, 0, w, d, H, c, { l: PAT.brick(dk(c, .12)), r: PAT.brick(dk(c, .36)) });
  qy(0, w, d, H - .7, H, '#f4f2ea'); qx(w, 0, d, H - .7, H, dk('#f4f2ea', .2)); qy(0, w, d, 0, .25, dk(AP.conc, .2));
  const nb = Math.max(2, Math.floor((tx - .4) / 2.5)), bw = (tx - .4) / nb;
  for (let i = 0; i < nb; i++) {
    const x = .4 + i * bw + .2, x1 = x + bw - .4, open = i === (p.open === undefined ? 1 : p.open);
    qy(x - .1, x1 + .1, d, 0, 2.5, '#f4f2ea');
    if (open) { qy(x, x1, d, 0, 2.4, '#232836'); glow(() => qy(x, x1, d, 0, 2.4, '#f4c870', '#c9924a')); // fire truck nose
      const tc = '#c8e03a'; qy(x + .2, x1 - .2, d, .3, 2.0, tc); qy(x + .2, x1 - .2, d, .3, .7, '#d8483a'); winY(x + .35, x1 - .35, d, 1.15, 1.8, { on: false, glass: ['#34425a', '#3f5270'] }); qy(x + .2, x1 - .2, d, .15, .32, '#8a93a0');
      lit(() => { spx(x + .4, d, .55, 0, 0, '#fff6d0'); spx(x + .4, d, .55, 1, 0, '#fff6d0'); spx(x1 - .5, d, .55, 0, 0, '#fff6d0'); spx(x1 - .5, d, .55, 1, 0, '#fff6d0'); qy(x + .7, x1 - .7, d, 2.0, 2.12, '#3f8cff'); }); qy(x + .3, x + .7, d, 0, .3, '#1d1c26'); qy(x1 - .7, x1 - .3, d, 0, .3, '#1d1c26'); }
    else { qy(x, x1, d, 0, 2.4, PAT.siding('#e0e3e6', 3)); for (let k = 0; k < 3; k++) winY(x + .15 + k * (x1 - x - .3) / 3 + .05, x + .15 + (k + 1) * (x1 - x - .3) / 3 - .05, d, 1.4, 1.85, { on: r() < .5 }); }
    lit(() => wtext('y', String(i + 1), (x + x1) / 2 - .1, d + .01, 2.47 + .25, '#c94436'));
  }
  bsignY(p.name || 'FIRE & RESCUE', tx / 2 - 2, tx / 2 + 2, d + .02, H - .62, H - .1, '#fff8e0', '#c94436', { lit: true });
  qz(.15, w - .15, .15, d - .15, H, '#b9b7b6'); snowTop(.1, w - .1, .1, d - .1, H + .01); acUnit(1, 1, H);
  // hose / watch tower
  box(tx, d - 1.8, 0, 1.8, 1.8, 6.2, '#e4e2da', { l: PAT.stucco(dk('#e4e2da', .18)), r: PAT.stucco(dk('#e4e2da', .36)) });
  door(tx + .9, d, '#8a2f26'); for (let z = 2.2; z < 5; z += 1.3) { winY(tx + .55, tx + 1.25, d, z, z + .8, { on: r() < .5, mullion: 'h' }); winX(w, d - 1.3, d - .5, z, z + .8, { on: r() < .5, mullion: 'h' }); }
  qy(tx, w, d, 5.5, 5.9, c); qx(w, d - 1.8, d, 5.5, 5.9, dk(c, .2)); if (winter()) qz(tx + .1, w - .1, d - 1.7, d - .1, 6.21, SNOW);
  lw([tx + .9, d - .9, 6.2], [tx + .9, d - .9, 7.4], '#55627a'); lamp(tx + .9, d - .9, 7.45, '#ff4a3a', true);
  // siren
  box(tx + .2, d - 1.5, 6.2, .5, .4, .3, '#f2c230');
}

/* ---------- fuel farm ---------- */
function fuel(p) {
  const n = p.n || 2, R = 1.6, H = p.h || 3.2, w = n * 4 + 1.5, d = 5, band = p.band || AP.red;
  // bund wall (back/left parts first)
  box(0, 0, 0, w, .2, .6, AP.conc); box(0, 0, 0, .2, d, .6, AP.conc); qz(.2, w - .2, .2, d - .2, .05, '#8f8c84', '#99968d');
  for (let i = 0; i < n; i++) {
    const cx = 2.3 + i * 4, cy = 2.3;
    cyl(cx, cy, 0, R, H, '#f1f0ea', { l: '#e2e1da', r: '#c2c2c4', t: winter() ? SNOW : '#dcdbd4' });
    arcWall(cx, cy, R + .02, -Math.PI, Math.PI, H - .9, H - .45, band, { n: 24 }); arcWall(cx, cy, R + .02, -Math.PI, Math.PI, .0, .25, '#8a93a0', { n: 24 });
    // dome cap + vent
    discZ(cx, cy, H + .12, R * .7, winter() ? SNOW : '#e8e7e0'); discZ(cx, cy, H + .2, R * .35, winter() ? SNOW : '#f4f3ee'); box(cx - .1, cy - .1, H + .2, .2, .2, .3, '#8a93a0', { ol: false });
    // ladder with cage on the +y side
    const lx = cx - .5, ly = cy + R * .92; for (const dx of [0, .3]) lw([lx + dx, ly, 0], [lx + dx, ly, H + .4], '#55627a'); for (let z = .3; z < H + .3; z += .3) lw([lx, ly, z], [lx + .3, ly, z], '#7c8792');
    wtext('y', p.label || 'JET A-1', cx + .0, cy + R * .78, H * .55, '#3d4654');
    // hazard diamond
    const hz = [cx + .25, cy + R * .97, H * .28]; for (const [a, b] of [[0, -2], [-1, -1], [0, -1], [1, -1], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [-1, 1], [0, 1], [1, 1], [0, 2]]) spx(hz[0], hz[1], hz[2], a, b, a === 0 && b === 0 ? '#2a2f3d' : '#f2c230');
    lamp(cx, cy, H + .55, '#ff4a3a');
    // outlet pipe to the manifold
    lw([cx + .8, cy + R, .4], [cx + .8, d - .9, .4], '#d8a23a'); lw([cx + .8, cy + R, .46], [cx + .8, d - .9, .46], '#f2c230');
  }
  lw([1, d - .9, .4], [w - 1.6, d - .9, .4], '#d8a23a'); lw([1, d - .9, .46], [w - 1.6, d - .9, .46], '#f2c230');
  for (let x = 1.5; x < w - 2; x += 2) { box(x, d - 1, 0, .15, .2, .4, '#8a93a0', { ol: false }); spx(x + .6, d - .9, .5, 0, -1, '#d8483a'); spx(x + .6, d - .9, .5, 0, -2, '#d8483a'); spx(x + .6, d - .9, .5, 1, -2, '#d8483a'); }
  // pump house
  box(w - 1.5, d - 2.2, 0, 1.2, 1.6, 1.5, '#9aa7b4'); qy(w - 1.35, w - .45, d - .6, .2, 1.2, PAT.siding('#6b7482', 2)); if (winter()) qz(w - 1.45, w - .35, d - 2.15, d - .65, 1.51, SNOW);
  box(.2, d - .2, 0, w - .2, .2, .6, AP.conc); box(w - .2, 0, 0, .2, d, .6, AP.conc);
  qy(1, 3.4, d + .01, .1, .5, '#f2c230'); wtext('y', 'NO SMOKING', 1.05, d + .02, .45, '#2a2f3d');
}

/* ---------- radar dome ---------- */
function radome(p) {
  const r = rng(p.seed || 1), c = '#e4e2da';
  box(0, 0, 0, 4, 4, 2, c, { l: PAT.stucco(dk(c, .18)), r: PAT.stucco(dk(c, .36)) }); qy(0, 4, 4, 0, .3, dk(AP.conc, .2)); qx(4, 0, 4, 0, .3, dk(AP.conc, .35));
  door(.9, 4); winY(1.9, 3.4, 4, .8, 1.5, { on: r() < .7, mullion: 'v', sill: true }); winX(4, .8, 2, .8, 1.5, { on: r() < .5, mullion: 'v', sill: true });
  qy(0, 4, 4, 1.7, 1.9, AP.teal); qx(4, 0, 4, 1.7, 1.9, dk(AP.teal, .2)); lit(() => wtext('y', 'RADAR', 2.0, 4.01, 1.92 - .25 + .2, '#ffe9a8'));
  qz(.15, 3.85, .15, 3.85, 2, '#c9c7bd'); snowTop(.1, 3.9, .1, 3.9, 2.01);
  // lattice pedestal
  const zb = 2, zt = 2 + (p.h || 2.4);
  cyl(2, 2, zb, .9, .3, AP.conc);
  for (const [a, b] of [[1.3, 1.3], [2.7, 1.3], [2.7, 2.7], [1.3, 2.7]]) lw([a, b, zb + .3], [a + (2 - a) * .3, b + (2 - b) * .3, zt], '#6b7482');
  for (let z = zb + .7; z < zt; z += .7) { const k = (z - zb - .3) / (zt - zb - .3) * .3, q = [[1.3, 1.3], [2.7, 1.3], [2.7, 2.7], [1.3, 2.7]].map(([a, b]) => [a + (2 - a) * k, b + (2 - b) * k, z]); lw(q[1], q[2], '#8a93a0'); lw(q[2], q[3], '#8a93a0'); lw(q[1], [q[2][0], q[2][1], z + .7], '#8a93a0'); lw(q[3], [q[2][0], q[2][1], z + .7], '#8a93a0'); }
  cyl(2, 2, zt, 1.25, .25, '#b9c2c9');
  ball(2, 2, zt + 1.55, 1.5, winter() ? '#eef3f7' : '#f1f0ea', { squash: .88 });
  // geodesic seams
  const cz = zt + 1.55; for (const [a, b, e, f] of [[-1.5, -.2, 0, -1.35], [0, -1.35, 1.6, -.3], [-1.7, .5, -.3, .1], [-.3, .1, 1.2, .55], [1.2, .55, 1.75, .3], [-.3, .1, 0, -1.35], [-.3, .1, -.6, 1.2], [1.2, .55, .9, 1.25], [-1.5, -.2, -1.7, .5], [1.2, .55, 1.6, -.3]]) { const s = (x, y) => [2 + x * .5, 2 - x * .5, cz - y]; lw(s(a, b), s(e, f), '#cfcdc6'); }
  lamp(2, 2, zt + 3.05, '#ff4a3a', true);
}

/* ---------- multi-storey car park ---------- */
const CARC = ['#d8483a', '#3f7fc4', '#f2c230', '#e9e6dc', '#2f8f8a', '#55627a', '#f08a2c', '#8c2f4a', '#9aa7b4'];
function carpark(p) {
  const w = p.w || 12, d = p.d || 9, fl = p.floors || 4, fh = 1.6, H = fl * fh, r = rng(p.seed || 1), c = '#d6d3c8', sw = 2.2;
  box(0, 0, 0, w, d, H, c);
  for (let f = 0; f < fl; f++) {
    const z = f * fh;
    // +y decks
    qy(sw, w - .2, d, z + .02, z + 1.05, '#2e3442'); glow(() => qy(sw, w - .2, d, z + .85, z + 1.05, '#dff2ff', '#9fc4e0'));
    if (f === 0) { // entrance + exit lanes
      const ex = sw + .6; qy(ex, ex + 2.6, d, 0, 1.05, '#1d2029'); qy(ex + 3.0, ex + 5.6 > w - .5 ? w - .5 : ex + 5.6, d, 0, 1.05, '#1d2029');
      qy(ex, ex + 2.6, d, 1.05, 1.25, PAT.vstripes('#f2c230', '#2a2f3d', 3)); lit(() => { wtext('y', 'IN', ex + 1.0, d + .01, 1.55 - .02, '#6dff8a'); if (ex + 5.6 <= w - .5) wtext('y', 'OUT', ex + 3.9, d + .01, 1.55 - .02, '#ff5a4a'); });
      lw([ex + .1, d, .55], [ex + 2.2, d, .7], '#f4f2ea'); lw([ex + .1, d, .5], [ex + 2.2, d, .65], '#d8483a'); box(ex - .1, d - .05, 0, .2, .15, .7, '#f2c230', { ol: false });
      sideCar(ex + 3.2, d - .02, .0, CARC[Math.floor(r() * CARC.length)], 1);
    } else for (let x = sw + .3; x + 2.6 < w - .3; x += 2.9) if (r() < .75) sideCar(x, d - .02, z + .05, CARC[Math.floor(r() * CARC.length)], r() < .5 ? 1 : -1);
    for (let x = sw; x < w - .3; x += 2.9) qy(x, x + .22, d, z, z + 1.05, dk(c, .22));
    qy(sw, w, d, z + 1.05, z + fh, f % 2 ? dk(c, .18) : dk(lt(c, .2), .18)); lw([sw, d, z + 1.05], [w, d, z + 1.05], dk(c, .5)); if (f) lw([sw, d, z + .3], [w - .2, d, z + .3], '#8a93a0');
    // +x decks
    qx(w, .3, d - .3, z + .02, z + 1.05, '#262b38'); glow(() => qx(w, .3, d - .3, z + .85, z + 1.05, '#c9e2f4', '#8fb4d0'));
    for (let y = .3; y < d - .3; y += 2.8) qx(w, y, y + .22, z, z + 1.05, dk(c, .4));
    for (let y = .7; y + 1.4 < d - .3; y += 1.4) if (f && r() < .6) { const cc = CARC[Math.floor(r() * CARC.length)]; qx(w - .01, y + .1, y + 1.2, z + .08, z + .6, dk(cc, .36)); qx(w - .01, y + .22, y + 1.08, z + .6, z + .95, '#2b3345'); lit(() => { }); }
    qx(w, 0, d, z + 1.05, z + fh, f % 2 ? dk(c, .36) : dk(lt(c, .2), .36)); if (f) lw([w, .3, z + .3], [w, d - .3, z + .3], '#7c8792');
  }
  // green screen fins
  for (let x = sw + 1.4; x < w - .5; x += 2.9) qy(x, x + .12, d + .01, fh, H, AP.teal);
  // stair / lift tower at the street corner
  box(0, d - 2.4, 0, sw, 2.4, H + 1.4, '#e9e6dc'); curtainY(.35, sw - .35, d, .4, H + .2, { sx: .75, sz: .8 }); qy(0, sw, d, 0, .35, dk(AP.conc, .2));
  qy(.55, 1.65, d + .005, 0, 1.6, '#3d4654'); winY(.65, 1.55, d + .01, .1, 1.5, { on: true, mullion: 'v' });
  lit(() => { qy(.3, sw - .3, d + .01, H + .3, H + 1.25, '#2f7fd0'); wtext('y', 'P', sw / 2 - 3 / 16, d + .02, H + 1.1, '#ffffff', 2); });
  curtainX(sw, d - 2.1, d - .3, H + .2, H + 1.1, { sx: .9, sz: .9 });
  // roof deck with cars and lamps
  qz(sw, w, 0, d, H, '#8f8c84', '#99968d'); qz(0, sw, 0, d - 2.4, H, '#8f8c84', '#99968d');
  for (let x = sw + .6; x + 1.3 < w - .4; x += 1.5) { lw([x - .12, .5, H], [x - .12, 3.3, H], '#f4f2ea'); if (r() < .55) { const cc = CARC[Math.floor(r() * CARC.length)]; box(x, .7, H, 1.2, 2.5, .5, cc); box(x + .08, 1.2, H + .5, 1.04, 1.4, .38, dk(cc, .1), { l: '#34425a', r: '#2b3345' }); } }
  for (let x = sw + .6; x + 1.3 < w - .4; x += 1.5) { lw([x - .12, d - 3.4, H], [x - .12, d - .6, H], '#f4f2ea'); if (r() < .45) { const cc = CARC[Math.floor(r() * CARC.length)]; box(x, d - 3.2, H, 1.2, 2.5, .5, cc); box(x + .08, d - 2.7, H + .5, 1.04, 1.4, .38, dk(cc, .1), { l: '#34425a', r: '#2b3345' }); } }
  snowTop(sw + .2, w - .2, 3.5, d - 3.6, H + .01);
  box(0, 0, H, w, .15, .5, c, { ol: false }); box(0, 0, H, .15, d - 2.4, .5, c, { ol: false }); qy(sw, w, d, H, H + .5, dk(c, .18)); qx(w, 0, d, H, H + .5, dk(c, .36)); lw([sw, d, H + .5], [w, d, H + .5], '#fbfaf4'); lw([w, 0, H + .5], [w, d, H + .5], '#fbfaf4');
  for (const [x, y] of [[w * .45, d / 2], [w * .8, d / 2]]) { lw([x, y, H], [x, y, H + 2.2], '#55627a'); lw([x - .4, y, H + 2.2], [x + .4, y, H + 2.2], '#55627a'); lamp(x - .4, y, H + 2.15, '#fff2c4'); lamp(x + .4, y, H + 2.15, '#fff2c4'); }
  if (winter()) qz(.1, sw - .1, d - 2.3, d - .1, H + 1.41, SNOW);
}

/* ---------- airport hotel ---------- */
function hotel(p) {
  const w = p.w || 10, d = p.d || 7, fl = p.floors || 7, H = 2.6 + (fl - 1) * 1.8, r = rng(p.seed || 1), c = p.wall || '#e7d9c2', acc = p.accent || '#2f8f8a', name = p.name || 'SKYWAY HOTEL';
  box(0, 0, 0, w, d, H, c, { l: PAT.stucco(dk(c, .18)), r: PAT.stucco(dk(c, .36)) });
  // lobby podium
  qy(0, w, d, 0, .3, PAT.stone(dk(AP.conc, .15))); qx(w, 0, d, 0, .3, PAT.stone(dk(AP.conc, .3)));
  const dx = w / 2;
  for (let x = .5; x + 1.3 < w; x += 1.5) if (Math.abs(x + .65 - dx) > 1.5) winY(x, x + 1.3, d, .3, 2.1, { on: true, mullion: 'h', frame: '#55627a' });
  glassDoorY(dx, d, 1.7, 1.85);
  for (let y = .6; y + 1.3 < d; y += 1.6) winX(w, y, y + 1.3, .5, 2.0, { on: r() < .8, mullion: 'h' });
  qy(0, w, d, 2.25, 2.6, acc); qx(w, 0, d, 2.25, 2.6, dk(acc, .2));
  // rooms
  for (let f = 1; f < fl; f++) {
    const z = 2.6 + (f - 1) * 1.8;
    for (let x = .55; x + 1.0 <= w - .4; x += 1.45) { const on = r() < .55; winY(x, x + 1.0, d, z + .45, z + 1.4, { on, mullion: 'v', sill: true, glowc: r() < .3 ? ['#ffe9c4', '#ffd9a0'] : undefined }); if (r() < .4) qy(x + .05, x + .45, d + .005, z + .5, z + 1.35, on ? '#e8c9a0' : '#c9b9a8'); }
    for (let y = .6; y + 1.0 <= d - .4; y += 1.5) winX(w, y, y + 1.0, z + .45, z + 1.4, { on: r() < .5, mullion: 'v', sill: true });
    lw([0, d, z], [w, d, z], dk(c, .32)); lw([w, 0, z], [w, d, z], dk(c, .5));
  }
  // vertical fin sign on the corner
  box(w - .25, d, 3.2, .25, .5, Math.min(H - 3.6, 6.5), acc);
  lit(() => { const t = 'HOTEL'; for (let i = 0; i < t.length; i++) wtext('y', t[i], w - .2 + .0, d + .51, 3.2 + Math.min(H - 3.6, 6.5) - .35 - i * .95 - (Math.min(H - 3.6, 6.5) - 4.9) / 2, '#fff8e0', 1); });
  // entrance canopy
  box(dx - 1.8, d, 2.05, 3.6, 1.3, .15, acc); lw([dx - 1.7, d + 1.2, 0], [dx - 1.7, d + 1.2, 2.05], '#8a93a0'); lw([dx + 1.7, d + 1.2, 0], [dx + 1.7, d + 1.2, 2.05], '#8a93a0');
  glow(() => { qy(dx - 1.6, dx + 1.6, d + 1.3, 2.0, 2.06, '#fff2c4'); }); if (winter()) qz(dx - 1.7, dx + 1.7, d + .1, d + 1.2, 2.21, SNOW);
  for (const px_ of [dx - 2.4, dx + 2.1]) { box(px_, d + .2, 0, .4, .4, .4, '#8a5a3c'); ball(px_ + .2, d + .4, .75, .32, winter() ? '#4f7f6a' : '#3f8a55'); }
  // roof
  box(-.1, -.1, H, w + .2, d + .2, .3, lt(c, .2)); qz(.2, w - .2, .2, d - .2, H + .3, '#b9b7b6'); snowTop(.2, w - .2, .2, d - .2, H + .31);
  acUnit(.8, 1, H + .3); box(w - 2.6, .8, H + .3, 1.6, 1.6, 1.1, '#9aa7b4'); cyl(2.8, 1.5, H + .3, .5, .9, '#8a6a4a');
  // rooftop letters on a frame
  const k = w >= 10 ? 2 : 1, sw = tw(name, k) / 16, sx = Math.max(.2, (w - sw) / 2), sz = H + .3;
  for (let x = sx; x <= sx + sw; x += sw / 4) lw([x, d - .3, sz], [x, d - .3, sz + .55 + 5 * k / 16], '#55627a');
  lw([sx, d - .3, sz + .45], [sx + sw, d - .3, sz + .45], '#55627a');
  lit(() => wtext('y', name, sx, d - .3, sz + .55 + 5 * k / 16, p.neon || '#ff7a5a', k));
  lamp(w - 1.8, 1.6, H + 1.45, '#ff4a3a');
}

/* ---------- car rental hut ---------- */
function rental(p) {
  const w = 5, d = 4, H = 2.5, c = p.col || '#f08a2c', name = p.name || 'BAY RENT-A-CAR', r = rng(p.seed || 1);
  box(0, 0, 0, w, d, H, '#f4f2ea'); qy(0, w, d, 0, .5, c); qx(w, 0, d, 0, .5, dk(c, .2));
  winY(1.9, w - .3, d, .5, 1.9, { on: true, mullion: 'v', frame: '#55627a' }); door(.95, d, dk(c, .1));
  winX(w, .5, d - .5, .8, 1.9, { on: true, mullion: 'v', frame: '#46526a' });
  // counter + key board visible inside
  qy(2.1, w - .5, d + .005, .55, .95, dk(c, .25)); glow(() => { });
  box(-.15, -.15, H, w + .3, d + .9, .2, c); if (winter()) qz(0, w, 0, d + .6, H + .21, SNOW);
  const k = 1, sw = tw(name) / 16 + .5; box((w - sw) / 2, d - .5, H + .2, sw, .2, .7, '#2a3140');
  bsignY(name, (w - sw) / 2, (w + sw) / 2, d - .29, H + .25, H + .85, null, '#ffe9a8', { lit: true });
  glow(() => qy(.2, w - .2, d + .74, H - .06, H, '#fff2c4'));
  // bunting
  const fc = ['#d8483a', '#f2c230', '#3f7fc4', '#2f8f8a']; for (let i = 0; i < 9; i++) { const x = .3 + i * .5; spx(x, d + .75, H - .1, 0, 0, fc[i % 4]); spx(x, d + .75, H - .1, 1, 0, fc[i % 4]); spx(x, d + .75, H - .1, 0, 1, fc[i % 4]); spx(x, d + .75, H - .1, 1, 1, fc[i % 4]); spx(x, d + .75, H - .1, 0, 2, fc[i % 4]); }
  // key-return box + sandwich sign
  box(w - .7, d + .1, 0, .4, .3, 1.0, '#55627a'); lit(() => spx(w - .5, d + .4, .8, 0, 0, '#6dff8a'));
  fq([[.1, d + .5, 0], [.7, d + .5, 0], [.6, d + .5, .9], [.2, d + .5, .9]], '#f4f2ea'); wtext('y', '$', .32, d + .5, .7, c);
}

/* ---------- taxi / bus shelter ---------- */
function shelter(p) {
  const w = p.w || 4, d = 1.5, H = 2.4, t = p.sign || 'TAXI', col = t === 'TAXI' ? ['#f2c230', '#1b2233'] : t === 'BUS' ? ['#2f7fd0', '#ffffff'] : ['#1f3554', '#ffffff'];
  // back glass wall + posts
  for (const x of [0, w - .12]) box(x, 0, 0, .12, .12, H, '#55627a', { ol: false });
  qy(.12, w - .12, .1, .3, H - .2, '#a9d8e8', 'glass'); lw([.12, .1, .3], [w - .12, .1, .3], '#55627a'); lw([.12, .1, 1.3], [w - .12, .1, 1.3], '#8fb4d0'); for (let x = w / 3; x < w - .2; x += w / 3) lw([x, .1, .3], [x, .1, H - .2], '#55627a');
  // lit ad panel on the -x end, side glass on the +x end
  lit(() => { qy(.14, 1.1, .16, .45, 2.0, '#fff8e0'); qy(.2, 1.04, .17, .95, 1.94, p.ad || '#2f8f8a'); wtext('y', 'FLY', .32, .18, 1.75, '#ffffff'); bmp('y', LEAF, .35, .18, 1.5, { '#': '#ffe9a8' }); wtext('y', 'MB', .37, .18, .86, '#1b2233'); });
  // bench
  box(1.5, .35, .42, w - 2.0, .45, .08, '#b98a52'); for (const x of [1.6, w - .7]) box(x, .45, 0, .1, .25, .42, '#55627a', { ol: false });
  qx(w - .06, .12, d - .2, .3, H - .2, '#a9d8e8', 'glass'); for (const x of [0, w - .12]) box(x, d - .25, 0, .12, .12, H, '#55627a', { ol: false });
  // roof + sign
  box(-.15, -.1, H, w + .3, d + .2, .14, '#e6e9ea', { t: winter() ? SNOW : '#dfe3e6' }); glow(() => qy(.3, w - .3, d + .1, H - .05, H, '#fff2c4'));
  const sw = tw(t, 2) / 16 + .4; box((w - sw) / 2, d - .25, H + .14, sw, .18, .85, col[0]);
  bsignY(t, (w - sw) / 2, (w + sw) / 2, d - .06, H + .16, H + .97, col[0], col[1], { lit: true, k: 2 });
}

export default [
  { id: 'bld.airport.tower', kind: 'building', tags: ['airport', 'landmark', 'tower'], size: p => [6, 6, 2.2 + (p.h || 11) + 3], vb: p => [-.4, -.4, 0, 9.5, 8.8, 2.2 + (p.h || 11) + 5.6], door: { side: 'y', at: 1.1 },
    variants: [{ h: 11, seed: 1 }, { h: 8, seed: 3, accent: '#f08a2c' }], draw: tower },
  { id: 'bld.airport.hangar.arch', kind: 'building', tags: ['airport', 'hangar', 'airside'], size: p => [p.w || 12, p.d || 10, 1.6 + (p.rise || 3.9)], door: { side: 'y', at: .7 },
    variants: [{ w: 12, d: 10, seed: 1 }, { w: 10, d: 8, seed: 2, col: '#c9b48a', name: 'HANGAR 2', open: 0, rise: 3.4 }, { w: 16, d: 12, seed: 3, col: '#8fa9c9', name: 'HANGAR 3', open: 2.4, rise: 4.6, logo: '#27456b' }], draw: hangarArch },
  { id: 'bld.airport.hangar.box', kind: 'building', tags: ['airport', 'hangar', 'airside'], size: p => [p.w || 14, p.d || 9, (p.h || 4.4) + 1.3], door: { side: 'y', at: 11.8 },
    variants: [{ w: 14, d: 9, seed: 1 }, { w: 16, d: 10, seed: 4, col: '#c97a5a', name: 'BAYJET SERVICE', open: 1.6, h: 4.8, ink: '#1a6f6b', logo: '#1f8f8a' }, { w: 12, d: 8, seed: 6, col: '#8a93a0', name: 'AERO CLUB', door: '#f2c230', h: 4 }], draw: hangarBox },
  { id: 'bld.airport.cargo', kind: 'building', tags: ['airport', 'cargo', 'warehouse'], size: p => [p.w || 14, p.d || 8, 4.7], vb: p => [-.3, -.3, 0, (p.w || 14) + .3, (p.d || 8) + 1.1, 5.1],
    variants: [{ w: 14, d: 8, seed: 1 }, { w: 18, d: 9, seed: 5, col: '#cfd6da', accent: '#d8483a', name: 'QUIKPAK EXPRESS', bay: 'D' }], draw: cargo },
  { id: 'bld.airport.fire', kind: 'building', tags: ['airport', 'fire', 'rescue'], size: p => [p.w || 10, 6, 6.2], vb: p => [-.3, -.3, 0, (p.w || 10) + .3, 6.3, 7.9], door: { side: 'y', at: 9.1 },
    variants: [{ w: 10, seed: 1 }, { w: 12, seed: 2, open: 0 }], draw: fire },
  { id: 'bld.airport.fueltanks', kind: 'building', tags: ['airport', 'fuel', 'industrial'], size: p => [(p.n || 2) * 4 + 1.5, 5, (p.h || 3.2) + .5], vb: p => [-.3, -.3, 0, (p.n || 2) * 4 + 1.8, 5.3, (p.h || 3.2) + 1.2],
    variants: [{ n: 2 }, { n: 3, h: 3.8, band: '#2f7fd0', label: 'AVGAS' }], draw: fuel },
  { id: 'bld.airport.radome', kind: 'building', tags: ['airport', 'radar', 'landmark'], size: p => [4, 4, 2 + (p.h || 2.4) + 3.2], vb: p => [-.3, -.3, 0, 4.3, 4.3, 2 + (p.h || 2.4) + 3.8], door: { side: 'y', at: .9 },
    variants: [{ h: 2.4, seed: 1 }, { h: 4, seed: 2 }], draw: radome },
  { id: 'bld.airport.carpark', kind: 'building', tags: ['airport', 'parking'], size: p => [p.w || 12, p.d || 9, (p.floors || 4) * 1.6 + .5], vb: p => [-.3, -.3, 0, (p.w || 12) + .3, (p.d || 9) + .3, (p.floors || 4) * 1.6 + 2.7], door: { side: 'y', at: 1.1 },
    variants: [{ w: 12, d: 9, floors: 4, seed: 1 }, { w: 16, d: 10, floors: 5, seed: 2 }, { w: 10, d: 8, floors: 3, seed: 3 }], draw: carpark },
  { id: 'bld.airport.hotel', kind: 'building', tags: ['airport', 'hotel'], size: p => [p.w || 10, p.d || 7, 2.6 + ((p.floors || 7) - 1) * 1.8 + .3], vb: p => [-.4, -.4, 0, (p.w || 10) + .4, (p.d || 7) + 1.5, 2.6 + ((p.floors || 7) - 1) * 1.8 + 2.4], door: { side: 'y', at: 5 }, light: { x: 5, y: 8.5, z: 0, r: 4 },
    variants: [{ w: 10, d: 7, floors: 7, seed: 1 }, { w: 12, d: 7, floors: 9, seed: 2, wall: '#d9dde6', accent: '#27456b', name: 'MAPLE BAY INN', neon: '#8fe0ff' }, { w: 8, d: 6, floors: 5, seed: 3, wall: '#e9c9b4', accent: '#c93f7a', name: 'JETLAG INN', neon: '#ffd24a' }].map(v => Object.assign(v, {})), draw: hotel },
  { id: 'bld.airport.rental', kind: 'building', tags: ['airport', 'rental', 'kiosk'], size: [5, 4, 2.7], vb: [-.3, -.3, 0, 5.3, 5.1, 3.7], door: { side: 'y', at: .95 }, light: { x: 2.5, y: 5, z: 0, r: 3 },
    variants: [{ seed: 1 }, { seed: 2, col: '#2f8f8a', name: 'GO-GO CARS' }, { seed: 3, col: '#3f7fc4', name: 'ZOOM RENTAL' }], draw: rental },
  { id: 'prop.airport.shelter', kind: 'prop', solid: true, tags: ['airport', 'taxi', 'bus', 'shelter'], size: p => [p.w || 4, 1.5, 2.6], vb: p => [-.3, -.3, 0, (p.w || 4) + .3, 1.9, 3.7], light: { x: 2, y: 2, z: 0, r: 3 },
    seats: [{ x: 2, y: .8, z: .5, dir: 1 }, { x: 2.8, y: .8, z: .5, dir: 1 }], variants: [{ sign: 'TAXI' }, { sign: 'BUS', ad: '#c93f7a' }, { sign: 'SHUTTLE', w: 5, ad: '#f08a2c' }], draw: shelter },
];
