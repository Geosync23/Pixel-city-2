// Station kit for the elevated light rail + the grand Central Station hall.
// Platforms use the viaduct's local z: z = 0 is the deck underside, the platform top is at z = 1.2 (0.6 above the track bed).
// Platform furniture + canopy are separate props placed ON the platform top (their local z = 0).
import { box, qy, qx, qz, lw, fq, lit, glow, dk, lt, mix, ENV, PAT, rng, textY, textX, textW, signY, signX, winY, winX, gable, hip, U, at, cyl, ball } from '../../engine/raster.js';
import { list, num, RAIL, COL, disc, lamp, halo, post, pole, prof, ledY, ledX, tw, sparse, glassY, glassX } from './_lib.js';

const CONC = '#bdb8ab', STEEL = '#56636b', STEELD = '#3d4a54', PT = RAIL.PLAT_TOP, PW_ = RAIL.PLAT_W, LINE = '#d2412f', NAVY = '#26335e';
const clockFace = (plane, x, y, z, r, seed) => {
  const rr = rng(seed || 4), a1 = rr() * 6.28, a2 = rr() * 6.28, P = (dx, dz) => plane === 'y' ? [x + dx, y, z + dz] : [x, y - dx, z + dz];
  disc(plane, x, y, z, r + .07, '#2a2634'); halo(...P(0, 0), Math.round(r * U * 1.6), '#fff2c4');
  lit(() => { disc(plane, x, y, z, r, '#fbf6e6'); lw(P(0, 0), P(Math.cos(a1) * r * .8, Math.sin(a1) * r * .8), '#25212d'); lw(P(0, 0), P(Math.cos(a2) * r * .5, Math.sin(a2) * r * .5), '#25212d'); lw(P(0, 0), P(0, 0), '#c93a30'); });
};
/** glass balustrade along x at plane y */
function fence(x0, x1, y, z, h = 1.0) {
  glassY(x0, x1, y, z + .08, z + h - .06, '#d4f2f6', 3);
  for (let x = x0; x <= x1 + .01; x += 2) { const xx = Math.min(x, x1 - .04); lw([xx, y, z], [xx, y, z + h], STEEL); }
  lw([x0, y, z + h], [x1, y, z + h], '#8d939e'); lw([x0, y, z + .06], [x1, y, z + .06], STEEL);
}
const tactile = (x, y) => { const fx = (x * 8) % 2, fy = (y * 8) % 2; return (Math.floor(x * 8) + Math.floor(y * 8)) % 2 ? '#f2c230' : '#dba91c'; };

function drawPlatform(p) {
  const L = num(p.len, 8, 1, 64), W = PW_, front = (p.edge || 'y0') === 'y0', snow = ENV.season === 3 && p.covered === false;
  if (!front && p.fence !== false) fence(0, L, .04, PT);
  for (let x = 1.5; x < L; x += 4) { box(x, .3, 0, .3, W - .6, .5, dk(CONC, .2), { ol: false }); }
  box(0, 0, .5, L, W, PT - .5, CONC, { t: snow ? PAT.ftile('#e6ecf1', '#dbe3ea', .5) : PAT.ftile('#d8d1c1', '#cdc5b4', .5), l: front ? PAT.planks(dk(CONC, .18), 16) : dk(CONC, .5) });
  const e = front ? 0 : W;                               // track-side edge
  qz(0, L, front ? .32 : W - .62, front ? .62 : W - .32, PT + .002, tactile);
  qz(0, L, front ? 0 : W - .1, front ? .1 : W, PT + .002, '#f6f2e6');
  if (!front) { qy(0, L, W, .5, PT - .12, '#3a3644'); lw([0, W, PT - .12], [L, W, PT - .12], '#f2c230'); lw([0, W, PT], [L, W, PT], '#f6f2e6'); }
  else lw([0, W, .5], [L, W, .5], dk(CONC, .6));
  if (front && p.fence !== false) fence(0, L, W - .04, PT);
}

function drawCanopy(p) {
  const L = num(p.len, 8, 2, 64), W = PW_, H = num(p.h, 3.3, 2.4, 6), zc = H - .25, ze = H + .1, snow = ENV.season === 3, y0 = -.3, y1 = W + .3, mid = W / 2;
  // back wing (rises toward -y): seen from below-front, so draw the underside tone first
  const xs = []; for (let x = 2; x < L; x += 4) xs.push(x);
  for (const x of xs) { box(x - .1, mid - .1, 0, .2, .2, zc - .5, STEEL); box(x - .16, mid - .16, 0, .32, .32, .12, STEELD, { ol: false });
    lw([x, mid, zc - .55], [x, y0 + .2, ze - .08], STEELD); lw([x, mid, zc - .55], [x, y1 - .2, ze - .08], STEELD); lw([x, mid, zc - .5], [x, y0 + .2, ze - .03], STEEL); lw([x, mid, zc - .5], [x, y1 - .2, ze - .03], STEEL); }
  box(0, mid - .08, zc - .14, L, .16, .14, STEELD, { ol: false });                                   // spine beam
  glow(() => qz(.2, L - .2, .15, W - .15, .01, '#4f4e66'));
  const pane = (ya, za, yb, zb) => {
    fq([[0, ya, za], [L, ya, za], [L, yb, zb], [0, yb, zb]], sparse(snow ? '#f4f8fb' : '#c4ecf2', snow ? 2 : 3));
    if (snow) fq([[0, ya, za], [L, ya, za], [L, (ya + yb) / 2, (za + zb) / 2], [0, (ya + yb) / 2, (za + zb) / 2]], '#f4f8fb', ya < yb ? 'glass' : undefined);
    for (let x = 0; x <= L + .01; x += 1) lw([Math.min(x, L), ya, za], [Math.min(x, L), yb, zb], '#4d5d68');
  };
  pane(y0, ze, mid, zc); lit(() => lw([.2, mid + .09, zc - .15], [L - .2, mid + .09, zc - .15], '#fff2c4')); glow(() => qy(.2, L - .2, mid + .09, zc - .24, zc - .1, '#fff2c4')); pane(mid, zc, y1, ze);
  lw([0, y0, ze], [L, y0, ze], STEELD); lw([0, mid, zc], [L, mid, zc], STEELD);
  box(0, y1 - .06, ze - .1, L, .1, .12, STEEL, { ol: false }); lw([0, y1 + .04, ze + .02], [L, y1 + .04, ze + .02], '#8d939e'); lw([0, y1 + .04, ze - .1], [L, y1 + .04, ze - .1], STEELD);
  if (snow) lw([0, y1, ze + .04], [L, y1, ze + .04], COL.snow);
}

function drawStairs(p) {
  const h = num(p.h, 5.6, 1.4, 14), rise = .35, tread = .4, n = Math.round(h / rise), run = n * tread, land = 1.6, L = run + land, W = 2.4, esc = !!p.esc, ys = esc ? 1.05 : 0, c = p.color || CONC;
  const slopeRail = (y, col, glass) => { const a = [0, y, 1.0], b = [run, y, h + 1.0], e = [L, y, h + 1.0]; if (glass) { fq([[0, y, .1], [run, y, h + .1], [run, y, h + .95], [0, y, .95]], sparse('#d4f2f6')); glassY(run, L, y, h + .1, h + .95, '#d4f2f6'); } lw(a, b, col); lw(b, e, col); for (let x = 0; x <= run; x += tread * 4) lw([x, y, x / tread * rise], [x, y, x / tread * rise + 1.0], STEEL); lw([L - .03, y, h], [L - .03, y, h + 1.0], STEEL); };
  slopeRail(.05, '#8d939e', false);
  if (esc) {
    const k = h / run; prof([[0, .12], [.5, .12], [run - .2, h], [L, h]], 0, 1.0, 0, '#6f7882', { t: '#4a4856' });
    for (let x = .6; x < run - .2; x += .2) lw([x, .12, .12 + (x - .5) * (h - .12) / (run - .7)], [x, .88, .12 + (x - .5) * (h - .12) / (run - .7)], '#2f2b3a');
    for (const y of [.06, .94]) { fq([[.1, y, .2], [run - .2, y, h + .08], [run - .2, y, h + .8], [.1, y, .92]], sparse('#d4f2f6')); lw([.1, y, .92], [run - .2, y, h + .8], '#25212d'); lw([run - .2, y, h + .8], [run + .5, y, h + .8], '#25212d'); lw([.1, y, .92], [.1, y, .2], '#25212d'); }
    lamp(.3, 1.0, .5, '#4dff88', 2, 2, 2);
  }
  // stair flight: open sawtooth of steps (clearly readable from the +y side), a mid column, and a solid tower under the landing
  box(run / 2 - .15, ys + .4, 0, .3, W - ys - .8, Math.max(.2, (run / 2 / tread) * rise - .45), dk(c, .1));
  for (let i = 0; i < n; i++) { const zt = (i + 1) * rise, z0 = Math.max(0, zt - .5), x = i * tread;
    box(x, ys, z0, tread, W - ys, zt - z0, c, { t: i % 2 ? '#d8d1c1' : '#cdc5b4', ol: false });
    lw([x, ys, zt], [x + tread, ys, zt], dk(c, .7)); lw([x, W, zt], [x + tread, W, zt], lt(c, .5)); lw([x, W, zt - rise], [x, W, zt], dk(c, .45)); if (z0 > 0) lw([x, W, z0], [x + tread, W, z0], dk(c, .7)); lw([x + tread, W, z0], [x + tread, W, Math.max(0, z0 + rise)], dk(c, .7));
    lw([x + tread - .02, ys, zt + .005], [x + tread - .02, W, zt + .005], i % 4 === 3 ? '#f2c230' : '#a39e93'); }
  box(run, ys, 0, land, W - ys, h, c, { t: PAT.ftile('#d8d1c1', '#cdc5b4', .5), l: PAT.planks(dk(c, .18), 13) });
  qz(run, run + .3, ys, W, h + .004, tactile); lw([run, W, .3], [L, W, .3], dk(c, .32));
  qy(L - 1.25, L - .35, W + .003, 0, 1.7, '#4a5a66'); lw([L - .5, W + .003, .8], [L - .5, W + .003, .92], '#d9dde2'); qy(L - 1.3, L - .3, W + .003, 1.8, 2.2, '#f2c230'); textY('STAFF', L - .8 - 9.5 / U, W + .003, 2.16, '#25212d');
  if (h > 3) { const nm = String(p.name || 'TRAINS').slice(0, 6); signY(nm, run + .05, L - .05, W + .004, h - 1.3, h - .7, NAVY, '#f6f2e6', { lit: true }); lit(() => { disc('y', run + land / 2, W + .004, h - 1.85, .24, '#f6f2e6'); disc('y', run + land / 2, W + .004, h - 1.85, .17, LINE); }); }
  slopeRail(W - .04, '#c9ced6', false);
  lamp(.1, W - .04, 1.1, '#fff2c4', 3, 2, 2); lamp(run, W - .04, h + 1.1, '#fff2c4', 3, 2, 2);
}

function drawElevator(p) {
  const h = num(p.h, 5.6, 2.5, 14), W = 2.2, H = h + 2.9, f = STEELD, cabZ = Math.max(0, Math.min(1, p.cab === undefined || !isFinite(+p.cab) ? 1 : +p.cab)) * h;
  box(0, 0, 0, W, W, .25, dk(CONC, .1));
  // back + far frame, cab, then front glass
  qy(0, W, .05, .25, H - .5, '#7fa8b8', '#8fb8c6'); qx(.05, 0, W, .25, H - .5, '#6f98a8', '#7fa8b8');
  box(.3, .3, cabZ + .05, W - .6, W - .6, 2.3, '#e8e4da', { l: '#d8d2c0', r: '#c4beac' });
  qy(.45, W - .45, W - .3, cabZ + .9, cabZ + 2.1, '#9fd6e8', '#b6e2ee'); lit(() => qy(.45, W - .45, W - .3, cabZ + .9, cabZ + 2.1, '#ffe9a8', '#f7d98a')); qx(W - .3, .45, W - .45, cabZ + .9, cabZ + 2.1, '#8cc6d8'); lit(() => qx(W - .3, .45, W - .45, cabZ + .9, cabZ + 2.1, '#f7d98a', '#eec672'));
  lw([W / 2, W / 2, cabZ + 2.35], [W / 2, W / 2, H - .5], '#3a3644');
  glassY(0, W, W, .25, H - .5, '#d4f2f6', 3); glassX(W, 0, W, .25, H - .5, '#b4dce6', 3);
  for (const [x, y] of [[0, W], [W, W], [W, 0]]) lw([x, y, .25], [x, y, H - .5], f);
  for (let z = .25; z < H - .5; z += (h - .25) / 2) { lw([0, W, z], [W, W, z], f); lw([W, 0, z], [W, W, z], f); }
  lw([0, W, h], [W, W, h], '#8d939e'); lw([W, 0, h], [W, W, h], '#8d939e');
  // ground door + call panel
  qy(.55, W - .55, W + .003, .25, 2.2, '#8d939e'); lw([W / 2, W + .003, .25], [W / 2, W + .003, 2.2], '#3a3644'); qy(.5, W - .5, W + .003, 2.2, 2.3, f); lamp(W - .35, W + .01, 1.3, '#4dff88', 0, 1, 2);
  box(-.1, -.1, H - .5, W + .2, W + .2, .5, NAVY); signY('LIFT', .5, W - .5, W + .105, H - .44, H - .06, NAVY, '#f6f2e6', { lit: true, frame: false });
  if (ENV.season === 3) qz(0, W, 0, W, H + .01, COL.snow, 'glass');
}

function drawEntrance(p) {
  const w = num(p.w, 8, 5, 16), d = num(p.d, 5, 3, 10), H = 3.2, name = String(p.name || 'MAPLE BAY'), r = rng(p.seed || 1), stone = p.wall || '#e6dcc6', lc = p.line || LINE;
  box(0, 0, 0, w, d, H, stone, { l: PAT.stone(dk(stone, .18)), r: PAT.stone(dk(stone, .36)), t: '#8f9aa0' });
  // glazed front with the gate line inside
  const gx0 = .6, gx1 = w - .6;
  qy(gx0, gx1, d + .002, 0, 2.5, '#2c3a44'); qy(gx0 + .08, gx1 - .08, d + .003, .08, 2.42, '#7fb6d0', '#9fcbe0'); glow(() => qy(gx0 + .08, gx1 - .08, d + .003, .08, 2.42, '#ffe2a0', '#f7d58a'));
  for (let x = gx0 + 1.2; x < gx1 - .5; x += 1.2) { lw([x, d + .003, .08], [x, d + .003, 2.42], '#2c3a44'); glow(() => lw([x, d + .003, .08], [x, d + .003, 2.42], '#8a6a3a')); }
  lw([gx0, d + .003, 1.9], [gx1, d + .003, 1.9], '#2c3a44'); glow(() => lw([gx0, d + .003, 1.9], [gx1, d + .003, 1.9], '#8a6a3a'));
  // ticket gates seen through the glass
  const gate = () => { for (let x = w / 2 - 1.8; x < w / 2 + 1.9; x += .9) { qy(x, x + .25, d + .004, .1, .9, '#56636b'); qy(x + .05, x + .2, d + .004, .72, .86, '#4dff88'); } };
  gate(); glow(gate);
  qy(w / 2 - .9, w / 2 + .9, d + .004, 0, .08, '#f2c230');                                           // door threshold (centre bays are the doors)
  // side windows
  for (let y = .8; y + 1.2 < d; y += 1.9) winX(w, y, y + 1.2, .7, 2.2, { on: r() < .8, mullion: 'v', sill: true });
  // flat roof with deep fascia + sign
  box(-.3, -.3, H, w + .6, d + .9, .55, NAVY, { t: '#8f9aa0' });
  const sw = tw(name, 10); signY(name, w / 2 - sw / 2 + .3, w / 2 + sw / 2 + .3, d + .605, H + .06, H + .5, NAVY, '#fff8e0', { lit: true, frame: false });
  const rx = w / 2 - sw / 2 - .05; lit(() => { disc('y', rx, d + .605, H + .28, .2, '#f6f2e6'); disc('y', rx, d + .605, H + .28, .14, lc); });
  qx(w + .3, -.3, d + .6, H + .22, H + .32, lc);
  glow(() => qz(.4, w - .4, d + .05, d + .55, H - .01, '#fff2c4'));
  // roof clutter
  box(1, 1, H + .55, 1.4, 1.0, .5, '#b8bcc0'); box(w - 2.6, .8, H + .55, 1.6, 2.2, .1, '#2f4f8f', { t2: '#3c64ad' });
  if (ENV.season === 3) qz(0, w, 0, d, H + .56, COL.snow, 'glass');
  // bike + poster on the wall
  qy(.12, .5, d + .003, .9, 1.9, '#f1ead6'); qy(.16, .46, d + .003, 1.3, 1.85, '#3b7bd6');
}

/** arched window on a +y wall: rect x0..x1 from z0 up to the springing zs, then a semicircle. Glass + glazing bars, glows when on. */
function archWinY(x0, x1, y, z0, zs, o) {
  o = o || {}; const R = (x1 - x0) / 2, Rp = R * U, hpx = (zs - z0) * U, fr = o.frame || '#4a4458', m = o.m || 8;
  const pat = (g1, g2, bar) => (u, v) => { const dx = u + .5 - Rp, dz = v + .5 - hpx, d = dz > 0 ? Math.hypot(dx, dz) : Math.abs(dx); if (d > Rp) return null; if (d > Rp - 1.2 || v < 1) return fr;
    if (dz > 0) { const a = Math.atan2(dz, dx), k = a / Math.PI * (o.rays || 6); if (Math.abs(k - Math.round(k)) * d * Math.PI / (o.rays || 6) < .6 || Math.abs(d - Rp * .45) < .6) return bar; if (d < Rp * .45) return g2; }
    else if (Math.floor(u) % m === 0 || Math.floor(v) % (m + 2) === 0 || dz > -1) return bar;
    return ((Math.floor(u) + Math.floor(v)) & 1) ? g1 : g2; };
  qy(x0, x1, y, z0, zs + R, pat(o.g1 || '#7fb6d0', o.g2 || '#9fcbe0', fr));
  if (o.on !== false) glow(() => qy(x0, x1, y, z0, zs + R, pat('#ffd98a', '#f7c870', '#a8763a')));
}

function drawCentral(p) {
  const W = 26, D = 12, H = 7, st = p.wall || '#e8dcc0', st2 = dk(st, .1), roofC = '#5a7a84', r = rng(p.seed || 3), yF = D, px0 = 8, px1 = 18, PH = 9.2, py = D + .8;
  const cornice = (x0, x1, y0, y1, z) => { box(x0 - .2, y0 - .2, z, x1 - x0 + .4, y1 - y0 + .4, .3, lt(st, .2)); };
  // --- main block with wings ---
  box(0, 0, 0, W, D, H, st, { l: (u, v) => v < 20 ? PAT.stone(dk(st, .26))(u, v) : PAT.stucco(dk(st, .18))(u, v), r: (u, v) => v < 20 ? PAT.stone(dk(st, .42))(u, v) : dk(st, .36) });
  lw([0, yF, 1.25], [W, yF, 1.25], dk(st, .45));
  for (const [a, b] of [[0, px0], [px1, W]]) {
    const n = 3, bay = (b - a) / n;
    for (let i = 0; i < n; i++) { const cx = a + bay * (i + .5); qy(cx - 1.0, cx + 1.0, yF + .002, 1.3, 6.3, dk(st, .26));
      archWinY(cx - .8, cx + .8, yF + .003, 1.6, 4.9, { on: r() < .75, rays: 4 }); lw([cx - .95, yF + .003, 1.5], [cx + .95, yF + .003, 1.5], lt(st, .4));
      for (const xx of [a + bay * i + .15, a + bay * (i + 1) - .4]) { box(xx, yF, 1.3, .25, .12, 5.0, lt(st, .12), { ol: false }); box(xx - .05, yF, 6.2, .35, .16, .16, lt(st, .3), { ol: false }); } }
  }
  for (let y = 1.2; y + 1.6 < D; y += 2.7) { qx(W + .002, y - .2, y + 1.8, 1.3, 6.3, dk(st, .42)); winX(W + .003, y, y + 1.6, 1.7, 5.6, { on: r() < .7, mullion: 'cross', sill: true }); }
  cornice(0, W, 0, D, H);
  // wing roofs: copper-green hips with a glazed lantern ridge
  hip(0, 0, H + .3, W, D, 2.4, roofC, { inset: .45, over: .05 });
  box(3, D / 2 - 1.4, H + 2.4, W - 6, 2.8, .5, '#3d5a64', { l: PAT.vstripes('#9fd6e8', '#3d5a64', 6), ol: true }); glow(() => qy(3, W - 3, D / 2 + 1.4, H + 2.45, H + 2.85, PAT.vstripes('#ffd98a', '#3d5a64', 6)));
  gable(3, D / 2 - 1.4, H + 2.9, W - 6, 2.8, .7, 'x', '#7fb6c4', { over: .1, f: '#a8dce6', f2: '#8fc8d4', wall: '#3d5a64' });
  for (let x = 4; x < W - 3; x += 1.5) lw([x, D / 2, H + 3.6], [x, D / 2 + 1.5, H + 2.85], '#3d5a64');
  // --- central pavilion ---
  box(px0, D - 1, 0, px1 - px0, 1.8, PH, st, { l: (u, v) => v < 20 ? PAT.stone(dk(st, .22))(u, v) : dk(st, .16), r: dk(st, .34) });
  const cx = (px0 + px1) / 2;
  qy(cx - 3.5, cx + 3.5, py + .002, 0, 7.9, dk(st, .26));
  archWinY(cx - 3.1, cx + 3.1, py + .003, 2.7, 4.6, { on: true, rays: 8, m: 10 });
  // entrance doors under the great window
  for (let i = -1; i <= 1; i++) { const x = cx + i * 2.0; qy(x - .8, x + .8, py + .004, 0, 2.3, '#3a2f2a'); for (const s of [-1, 1]) { const a = x + (s < 0 ? -.7 : .06); qy(a, a + .64, py + .005, .12, 2.05, '#6aa2bd', '#86bcd2'); glow(() => qy(a, a + .64, py + .005, .12, 2.05, '#ffd98a', '#f4c870')); lw([a + (s < 0 ? .58 : .06), py + .005, 1.0], [a + (s < 0 ? .58 : .06), py + .005, 1.15], '#f2c230'); } }
  // iron + glass marquee
  box(cx - 3.6, py, 2.45, 7.2, 1.3, .12, '#2f4a4a', { t: PAT.vstripes('#a8e0ea', '#2f4a4a', 8), ol: true });
  lit(() => { for (let x = cx - 3.4; x < cx + 3.5; x += .45) qy(x, x + .12, py + 1.3, 2.36, 2.44, '#fff2c4'); });
  glow(() => qz(cx - 3.4, cx + 3.4, py + .1, py + 1.2, 2.44, '#fff2c4'));
  // name frieze
  const nm = String(p.name || 'CENTRAL STATION'), nw = tw(nm, 12); signY(nm, cx - nw / 2, cx + nw / 2, py + .004, 8.15, 8.75, '#2a3440', '#ffd98a', { lit: true });
  // giant order pilasters
  for (const x of [px0 + .15, px0 + 1.0, px1 - 1.4, px1 - .55]) { box(x, py, 0, .4, .16, 7.9, lt(st, .14), { ol: false }); box(x - .08, py, 7.75, .56, .2, .22, lt(st, .35), { ol: false }); box(x - .08, py, 0, .56, .2, .4, st2, { ol: false }); }
  for (let y = D - .6; y < py - .2; y += 9) winX(px1 + .003, D - .7, D + .5, 3, 6.5, { on: true, mullion: 'cross' });
  cornice(px0, px1, D - 1, py, PH);
  // pediment with the clock
  gable(px0, D - 1, PH + .3, px1 - px0, 1.8, 2.3, 'y', roofC, { wall: lt(st, .05), over: .2 });
  clockFace('y', cx, py + .03, PH + 1.1, .62, p.seed || 4);
  lw([cx, D, PH + 2.6], [cx, D, PH + 4.4], '#56636b'); fq([[cx, D, PH + 4.4], [cx + .9, D, PH + 4.2], [cx, D, PH + 3.9]], LINE); lamp(cx, D, PH + 4.45, '#ff5a5a', 2, 1, 1);
  // statues / urns on the wing corners + front steps
  for (const x of [.5, px0 - .9, px1 + .5, W - .9]) { box(x, yF - .5, H + .3, .4, .4, .5, lt(st, .2)); ball(x + .2, yF - .3, H + 1.0, .2, lt(st, .1)); }
  box(px0 - .6, py, 0, px1 - px0 + 1.2, .9, .16, '#cfc6b2'); box(px0 - .3, py, .16, px1 - px0 + .6, .5, .16, '#d8cfbb');
  // lamps flanking the doors + banners
  for (const x of [px0 - .5, px1 + .5]) { pole(x, yF + .5, 0, 2.6, '#2f4a4a', .12); ball(x, yF + .5, 2.75, .2, '#fbf6e6'); lit(() => ball(x, yF + .5, 2.75, .16, '#fff2c4', { ol: false })); halo(x, yF + .5, 2.75, 8, '#fff2c4'); }
  for (const [x, c] of [[px0 - 2.2, LINE], [px1 + 1.6, '#2f8f96']]) { qy(x, x + .6, yF + .12, 2.2, 5.2, c); lw([x, yF + .12, 5.2], [x + .6, yF + .12, 5.2], '#2a2634'); disc('y', x + .3, yF + .125, 4.6, .2, '#f6f2e6'); textY(c === LINE ? '1' : '2', x + .2, yF + .125, 4.75, c); }
  if (ENV.season === 3) { qz(.3, W - .3, D * .5, D - .2, H + .31, COL.snow, 'glass'); qz(px0, px1, py + .1, py + 1.2, 2.58, COL.snow, 'glass'); }
}

const furn = (id, tags, size, draw, extra) => Object.assign({ id, kind: 'prop', tags: ['transit', 'station', 'platform', ...tags], size, solid: true, draw }, extra || {});
export default [
  { id: 'prop.rail.platform', kind: 'prop', tags: ['transit', 'rail', 'station', 'platform', 'deck'], solid: false, size: p => [num(p.len, 8, 1, 64), PW_, PT], vb: p => [-.1, -.2, 0, num(p.len, 8, 1, 64) + .1, PW_ + .2, PT + 1.2],
    variants: [{ len: 8, edge: 'y0' }, { len: 8, edge: 'y1' }, { len: 16, edge: 'y0', fence: false }], draw: drawPlatform },
  { id: 'prop.rail.canopy', kind: 'prop', tags: ['transit', 'rail', 'station', 'canopy', 'roof'], solid: false, size: p => [num(p.len, 8, 2, 64), PW_, num(p.h, 3.3, 2.4, 6) + .2], vb: p => [-.1, -.5, 0, num(p.len, 8, 2, 64) + .1, PW_ + .5, num(p.h, 3.3, 2.4, 6) + .4],
    light: { x: 4, y: 1.5, z: 0, r: 5 }, variants: [{ len: 8 }, { len: 16 }], draw: drawCanopy },
  furn('prop.rail.bench', ['bench', 'seat'], [1.6, .6, .9], p => {
    const c = p.color || '#3f7f8a';
    for (const x of [.15, 1.35]) { box(x, .1, 0, .1, .45, .42, STEELD, { ol: false }); }
    box(0, .05, .42, 1.6, .5, .08, c, { t: PAT.fboards(lt(c, .1), .17) }); box(0, .02, .5, 1.6, .08, .42, c, { l: PAT.siding(dk(c, .18), 3) });
    for (const x of [.52, 1.06]) box(x, .08, .5, .04, .46, .16, STEELD, { ol: false });
  }, { seats: [{ x: .4, y: .35, z: .5, dir: 1 }, { x: 1.2, y: .35, z: .5, dir: 1 }], variants: [{}, { color: '#b5654a' }] }),
  furn('prop.rail.board', ['departures', 'sign'], [3.2, .3, 3.2], p => {
    const rows = (Array.isArray(p.rows) && p.rows.length ? p.rows : [['1 CENTRAL', '2'], ['2 AIRPORT', '5'], ['1 HARBOR', '9']]).map(q => Array.isArray(q) ? q : [String(q), '']), Wb = 3.2;
    for (const x of [.2, Wb - .2]) box(x - .06, .09, 0, .12, .12, 3.1, STEEL);
    box(0, .05, 1.3, Wb, .2, 1.86, '#1b2026');
    lit(() => { qy(.06, Wb - .06, .255, 2.72, 3.1, NAVY); textY('DEPARTURES', .16, .256, 3.04, '#f6f2e6'); textY('MIN', Wb - .16 - 11 / U, .256, 3.04, '#9fd8ff');
      rows.slice(0, 3).forEach((rw, i) => { const z = 2.6 - i * .44; textY(String(rw[0]).slice(0, 9), .16, .256, z, i ? '#ffb347' : '#ffd98a'); const m = String(rw[1] === undefined ? '' : rw[1]).slice(0, 2); textY(m, Wb - .16 - textW(m) / U, .256, z, '#9cf2b0'); }); });
    glow(() => qz(.2, Wb - .2, .3, 1.0, .01, '#4a4658'));
  }, { variants: [{}, { rows: [['2 AIRPORT', '1'], ['1 OLD TOWN', '6'], ['2 HILLCREST', '12']] }] }),
  furn('prop.rail.ticket', ['ticket', 'machine'], [.8, .6, 1.8], p => {
    const c = p.color || LINE;
    box(0, 0, 0, .8, .6, 1.7, c); box(-.04, -.04, 1.7, .88, .7, .1, dk(c, .3), { ol: false });
    lit(() => { qy(.12, .68, .603, 1.05, 1.5, '#1b2a44'); qy(.16, .64, .603, 1.3, 1.45, '#9fd8ff'); qy(.16, .38, .603, 1.1, 1.24, '#4dff88'); qy(.42, .64, .603, 1.1, 1.24, '#ffb347'); });
    qy(.14, .44, .603, .72, .92, '#c9ced6'); qy(.5, .66, .603, .74, .9, '#25212d'); qy(.2, .6, .603, .3, .48, '#25212d'); qy(.3, .5, .603, 1.56, 1.64, '#fff8e0');
  }, { use: { x: .4, y: 1.0 }, variants: [{}, { color: '#2f8f96' }] }),
  furn('prop.rail.namesign', ['sign', 'name'], p => [tw(p.name || 'MAPLE BAY', 14), .2, 2.4], p => {
    const nm = String(p.name || 'MAPLE BAY'), w = tw(nm, 14), lc = p.line || LINE;
    for (const x of [.12, w - .12]) box(x - .05, .05, 0, .1, .1, 2.3, STEEL);
    box(0, .04, 1.55, w, .12, .75, NAVY); lit(() => { qy(.04, w - .04, .165, 1.6, 2.26, '#fbf6e6'); qy(.04, w - .04, .165, 1.6, 1.72, lc); textY(nm, (w * U - textW(nm)) / 2 / U, .166, 2.13, NAVY); });
  }, { vb: p => [-.2, -.2, 0, tw(p.name || 'MAPLE BAY', 14) + .2, .5, 2.6], variants: [{ name: 'MAPLE BAY' }, { name: 'OLD TOWN', line: '#2f8f96' }, { name: 'HARBORSIDE' }] }),
  furn('prop.rail.clock', ['clock'], [.3, .3, 3.2], p => {
    box(.09, .09, 0, .12, .12, 2.5, STEELD); box(.03, .03, 0, .24, .24, .14, STEELD, { ol: false });
    box(-.25, .02, 2.45, .8, .26, .8, '#2f4a4a'); clockFace('y', .15, .285, 2.85, .3, p.seed || 2);
    qx(.55, .04, .26, 2.5, 3.2, '#263c3c');
  }, { vb: [-.5, -.2, 0, .8, .6, 3.5], variants: [{ seed: 2 }, { seed: 9 }] }),
  furn('prop.rail.vending', ['vending', 'machine'], [.9, .7, 1.9], p => {
    const c = p.color || '#3b7bd6', r = rng(p.seed || 1);
    box(0, 0, 0, .9, .7, 1.9, c);
    lit(() => { qy(.08, .62, .703, .55, 1.75, '#e8f4ff', '#d6eafa'); for (let z = .62; z < 1.7; z += .28) { qy(.08, .62, .703, z - .04, z, '#8d939e'); for (let x = .12; x < .58; x += .12) qy(x, x + .08, .703, z, z + .18, ['#e0453a', '#f2c230', '#3f9a6a', '#f26a2e', '#6d4c9a'][Math.floor(r() * 5)]); } });
    qy(.68, .84, .703, 1.1, 1.5, '#25212d'); lamp(.76, .71, 1.4, '#4dff88', 0, 1, 1); qy(.1, .6, .703, .15, .4, '#25212d');
  }, { use: { x: .45, y: 1.1 }, variants: [{ seed: 1 }, { color: '#d2412f', seed: 4 }] }),
  furn('prop.rail.bin', ['bin'], [.5, .5, .9], p => {
    box(.02, .02, 0, .46, .46, .8, p.color || '#4a6a5a', { l: PAT.planks(dk(p.color || '#4a6a5a', .18), 3) }); box(0, 0, .8, .5, .5, .1, '#3a3644'); qy(.12, .38, .503, .58, .72, '#25212d');
  }, { variants: [{}, { color: '#56636b' }] }),
  { id: 'bld.rail.stairs', kind: 'building', tags: ['transit', 'rail', 'station', 'stairs', 'access'], solid: true, size: p => [Math.round(num(p.h, 5.6, 1.4, 14) / .35) * .4 + 1.6, 2.4, num(p.h, 5.6, 1.4, 14)], vb: p => [-.2, -.2, 0, Math.round(num(p.h, 5.6, 1.4, 14) / .35) * .4 + 1.8, 2.7, num(p.h, 5.6, 1.4, 14) + 1.4],
    light: { x: 0, y: 3, z: 0, r: 4 }, variants: [{ h: 5.6 }, { h: 5.6, esc: true, seed: 1 }, { h: 3.5, seed: 2 }], draw: drawStairs },
  { id: 'bld.rail.elevator', kind: 'building', tags: ['transit', 'rail', 'station', 'elevator', 'access'], solid: true, size: p => [2.2, 2.2, num(p.h, 5.6, 2.5, 14) + 2.9], door: { side: 'y', at: 1.1 }, vb: p => [-.3, -.3, 0, 2.5, 2.5, num(p.h, 5.6, 2.5, 14) + 3.1],
    light: { x: 1.1, y: 3, z: 0, r: 3 }, variants: [{ h: 5.6 }, { h: 5.6, cab: 0 }], draw: drawElevator },
  { id: 'bld.rail.entrance', kind: 'building', tags: ['transit', 'rail', 'station', 'entrance'], solid: true, size: p => [num(p.w, 8, 5, 16), num(p.d, 5, 3, 10), 3.75], vb: p => [-.5, -.5, 0, num(p.w, 8, 5, 16) + .5, num(p.d, 5, 3, 10) + .8, 4.6], door: { side: 'y', at: 4 },
    light: { x: 4, y: 6.2, z: 0, r: 5 }, variants: [{ name: 'MAPLE BAY', seed: 1 }, { name: 'OLD TOWN', line: '#2f8f96', wall: '#c9a58a', seed: 2 }, { name: 'HARBORSIDE', w: 10, seed: 3 }], draw: drawEntrance },
  { id: 'bld.rail.central', kind: 'building', tags: ['transit', 'rail', 'station', 'landmark', 'downtown', 'central'], solid: true, size: [26, 12.8, 9.5], vb: [-.5, -.5, 0, 26.5, 14.4, 14.2], door: { side: 'y', at: 13 },
    light: { x: 13, y: 15, z: 0, r: 8 }, variants: [{ seed: 3 }], draw: drawCentral },
];
