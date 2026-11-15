// Maple Bay Observatory — ground floor art. ids furn.obs.* (the roof, dome and planetarium pieces live in observatory_sky.js, helpers in _obs_lib.js)
//   wallpanel  wall art (wall: true, mount 0). p: { w, kind: 'plain'|'const'|'planets'|'moonwall'|'window'|'poster', seed, phase 0-7 (moonwall), time/wx/frame (window), prog 0-4 (poster), a/b (const ids) }
//   rail {w} brass posts + velvet rope   gate {w, open, name}   pendulum {down 0-24} the Foucault pit (the bob is an entity)   orrery {a 0-47}
//   desk {kind: 'ticket'|'shop'|'cocoa', w, t}   shelf {kind: 'shop'|'cocoa', w}   meteorite {kind 0-2}   gravitywell   scale {lit 0-4}   rocket {away}
//   plaque {c}   hang {kind: planet id | 'comet', r} (overhead model)   bench   lamp   stairs   theatredoor {t}   board {s: '0246'}   lectern   screen {slide 0-3}
//   globe {kind}   scopecase   column
import * as R from '../../engine/raster.js';
import { NAVY, NAVY_D, NAVY_L, BRASS, BRASS_D, BRASS_L, CREAM, MARBLE, MARBLE_D, WOOD, WOOD_L, RED, TEAL, DARK, moonDisc, skyPx, CONS_BY_ID, CONSTELLATIONS, drawFigure, planetDisc, PLANETS, PHASE_NAMES } from './_obs_lib.js';
const { box, qy, qx, qz, fq, lw, lit, glow, cyl, ball, dk, lt, mix, PW, px, C, rng, line, ellipse, hash2, signY, textY, textW, PAT } = R;

export const S2 = (x, y, z) => { const s = PW(x, y, z); return [Math.round(s[0]), Math.round(s[1])]; };
export const dot = (x, y, z, c, dx = 0, dy = 0) => { const s = S2(x, y, z); px(s[0] + (R.isFlipped() ? -dx : dx), s[1] + dy, C(c)); };
/** horizontal disc of radius r (world units) at height z */
export const disc = (x, y, z, r, c, c2) => { const s = PW(x, y, z); ellipse(s[0], s[1], r * 22.6, r * 11.3, c, c2); };
/** put(u, vUp, hex, lit) painter over a wall plane y: column u (px along the wall from x = 0), v px above z0 */
export function wallPut(w, y, z0) {
  const n = Math.round(w * 16), X = new Int32Array(n), Y = new Int32Array(n); for (let i = 0; i < n; i++) { const q = PW((i + .5) / 16, y, z0); X[i] = Math.floor(q[0]); Y[i] = Math.round(q[1]); }
  return (u, v, c, li) => { if (u < 0 || u >= n) return; if (li) lit(() => px(X[u], Y[u] - 1 - v, C(c))); else px(X[u], Y[u] - 1 - v, C(c)); };
}
const star = (x, y, z, c = BRASS) => { dot(x, y, z, c); dot(x, y, z, c, 1, 0); dot(x, y, z, c, -1, 0); dot(x, y, z, c, 0, 1); dot(x, y, z, c, 0, -1); };
const tctr = (s, x0, x1, y, z, c) => textY(s, (x0 + x1) / 2 - textW(s) / 32, y, z, c);

/* ---------- wall panels ---------- */
const HW = 4.6;
function wallpanel(p) {
  const w = p.w || 4, k = p.kind || 'plain', y = .1, r = rng((p.seed || 3) + w * 7);
  qy(0, w, y, 0, HW, NAVY, k === 'window' ? null : undefined); qy(0, w, y, 0, .9, PAT.planks(WOOD, 6)); qy(0, w, y, .9, .98, BRASS); lw([0, y, .98], [w, y, .98], BRASS_L);
  qy(0, w, y, HW - .44, HW, CREAM); qy(0, w, y, HW - .5, HW - .44, BRASS); lw([0, y, HW], [w, y, HW], MARBLE_D);
  for (let x = 0; x <= w + .01; x += 2) { const a = Math.max(0, x - .08), b = Math.min(w, x + .08); if (b > a) { qy(a, b, y, .98, HW - .4, NAVY_L); lw([a, y, .98], [a, y, HW - .4], dk(NAVY, .3)); } }
  if (k === 'plain') { for (let i = 0; i < w * 2.2; i++) { const x = .3 + r() * (w - .6), z = 1.3 + r() * 2.6; if (r() < .35) star(x, y + .01, z, r() < .5 ? BRASS : BRASS_L); else dot(x, y + .01, z, r() < .5 ? BRASS : '#8a94c8'); } }
  else if (k === 'const') {
    const put = wallPut(w, y + .01, 1.2), n = Math.round(w * 16); let i = 0;
    for (const id of [p.a || 'orion', p.b || 'ursa']) { const c = CONS_BY_ID[id]; if (!c) continue; const bw = Math.min(52, n / 2 - 8), x0 = 6 + i * (n / 2); drawFigure((u, v, col) => put(u, 46 - v, col, false), c, x0, 0, bw, 40, { lines: true, lineC: BRASS_D, starC: BRASS_L, big: 2 }); tctr(c.name.split(',')[0].toUpperCase(), x0 / 16, (x0 + bw) / 16, y + .01, 1.5, BRASS); i++; }
  } else if (k === 'planets') {
    tctr('SCALE OF THE PLANETS', 0, w, y + .01, HW - .1, NAVY); const zc = 2.5, pt = (X, Y, c) => px(X, Y, C(c));
    for (let dx = 15; dx <= 36; dx++) { const s = PW(-.9 + dx / 16, y + .01, zc), hh = Math.min(26, Math.floor(Math.sqrt(36 * 36 - dx * dx))); for (let dy = -hh; dy <= hh; dy++) { const d = Math.hypot(dx, dy); lit(() => px(Math.round(s[0]), Math.round(s[1]) + dy, C(d > 33 ? '#f08a2a' : hash2(dx, dy, 3) > .82 ? '#ffe070' : '#ffc23a'))); } }
    textY('SUN', .25, y + .01, 1.5, BRASS_L);
    const xs = [1.9, 2.5, 3.15, 3.8, 5.2, 7.3, 8.75, 9.5], rs = [1, 1.6, 1.8, 1.2, 15, 12.5, 5.5, 5.3];
    PLANETS.forEach((P, i) => { if (xs[i] > w - .2) return; const q = PW(xs[i], y + .01, zc); planetDisc(pt, P.id, Math.round(q[0]), Math.round(q[1]), rs[i]); lw([xs[i], y + .01, 1.72], [xs[i], y + .01, zc - rs[i] / 16 - .1], BRASS_D); });
    for (const [s, x0, x1] of [['EARTH', 2.6, 3.7], ['JUPITER', 4.4, 6], ['SATURN', 6.6, 8], ['NEPTUNE', 8.3, 9.9]]) if (x1 <= w) tctr(s, x0, x1, y + .01, 1.5, BRASS_L);
  } else if (k === 'moonwall') {
    tctr('PHASES OF THE MOON', 0, w, y + .01, HW - .1, NAVY); const ph = p.phase === undefined ? 4 : p.phase;
    for (let i = 0; i < 8; i++) { const xc = .5 + i * (w - 1) / 7, q = PW(xc, y + .01, 2.7), X = Math.round(q[0]), Y = Math.round(q[1]), on = i === ph;
      ellipse(X, Y, on ? 8 : 6.5, on ? 8 : 6.5, on ? BRASS : NAVY_D); ellipse(X, Y, 5.6, 5.6, '#262c52');
      const pt = (a, b, c) => (on ? lit(() => px(a, b, C(c))) : px(a, b, C(c))); moonDisc(pt, X, Y, 5, i / 8, { c: on ? '#fffbe0' : '#d8d4c0', c2: on ? '#d0cdb8' : '#a8a594' });
      if (on) { lit(() => { for (const d of [-2, -1, 0, 1, 2]) px(X + d, Y + 10 + Math.abs(d), C(BRASS_L)); }); } }
    tctr('TONIGHT: ' + PHASE_NAMES[ph].toUpperCase(), 0, w, y + .01, 1.62, BRASS_L);
  } else if (k === 'window') {
    const x0 = .7, x1 = w - .7, put = wallPut(w, y + .01, 1.3), o = { time: p.time || 'day', wx: p.wx || null, frame: p.frame || 0 }, n0 = Math.round(x0 * 16), n1 = Math.round(x1 * 16), mid = (n0 + n1) / 2, hw = (n1 - n0) / 2;
    for (let u = n0; u < n1; u++) { const t = (u - mid) / hw, top = Math.round(30 + 14 * Math.sqrt(Math.max(0, 1 - t * t))); for (let v = 0; v < top; v++) { const s = skyPx(u + (p.u0 || 0), v + 26, o); put(u, v, s[0], s[1]); } put(u, top, BRASS, false); put(u, top + 1, BRASS_D, false); }
    for (const x of [x0, (x0 + x1) / 2, x1]) lw([x, y + .01, 1.3], [x, y + .01, x === (x0 + x1) / 2 ? 4.05 : 3.2], BRASS); for (const z of [1.3, 2.2, 3.15]) lw([x0, y + .01, z], [x1, y + .01, z], z === 1.3 ? BRASS_L : BRASS_D);
    qy(x0 - .1, x1 + .1, y + .02, 1.18, 1.3, MARBLE);
  } else if (k === 'poster') {
    const pr = p.prog || 0, bg = ['#141a3a', '#2a1a4a', '#3a1420', '#0f2a3a', '#101830'][pr % 5], x0 = w / 2 - .9, x1 = w / 2 + .9;
    qy(x0 - .08, x1 + .08, y + .01, 1.32, 3.78, BRASS); lit(() => { qy(x0, x1, y + .02, 1.4, 3.7, bg); const q = PW(w / 2, y + .02, 2.8), X = Math.round(q[0]), Y = Math.round(q[1]), pt = (a, b, c) => px(a, b, C(c));
      for (let i = 0; i < 14; i++) dot(x0 + .1 + r() * 1.2, y + .02, 1.6 + r() * 2, r() < .3 ? '#ffe9b0' : '#b8c6f0');
      if (pr === 0) drawFigure((a, b, c) => pt(X - 9 + a, Y - 9 + b, c), CONSTELLATIONS[9], 0, 0, 18, 20, { lines: true, big: 2 }); else if (pr === 1) planetDisc(pt, 'saturn', X, Y, 5); else if (pr === 2) { ellipse(X, Y, 8, 6, '#d8588a', 0 || undefined); ellipse(X + 1, Y, 5, 4, '#f4a0c0'); ellipse(X, Y, 2, 2, '#ffffff'); } else if (pr === 3) { for (let i = 0; i < 16; i++) for (let j = 0; j < 12; j++) if ((j + Math.round(Math.sin(i * .9) * 2)) % 4 < 2) px(X - 8 + i, Y - 8 + j + Math.round(Math.sin(i * .6) * 3), C(j < 5 ? '#7df0a0' : '#4ac8b0')); } else { for (let i = 0; i < 14; i++) { px(X - i, Y + (i >> 1), C(i < 3 ? '#ffffff' : '#a8d8ff')); if (i > 2) px(X - i, Y + (i >> 1) + 1, C('#5a8ad8')); } ellipse(X + 1, Y, 2, 2, '#ffffff'); }
      tctr(['THE SKY', 'PLANETS', 'STARS', 'AURORA', 'COMET'][pr % 5], x0, x1, y + .03, 1.86, '#ffe9b0'); });
    
  }
}

/* ---------- barriers ---------- */
function post(x, y, h = .95) { cyl(x, y, 0, .09, .06, BRASS_D, { ol: false }); cyl(x, y, .06, .04, h - .06, BRASS, { ol: false }); ball(x, y, h + .03, .07, BRASS_L, { ol: false }); }
function rope(x0, x1, y, z, c = '#7a2a3a') { const n = Math.max(4, Math.round((x1 - x0) * 8)); let pr = null; for (let i = 0; i <= n; i++) { const t = i / n, q = S2(x0 + (x1 - x0) * t, y, z - .18 * Math.sin(Math.PI * t)); if (pr) { line(pr, q, c); line([pr[0], pr[1] + 1], [q[0], q[1] + 1], dk(c, .3)); } pr = q; } }
function rail(p) { const w = p.w || 3, n = Math.max(1, Math.round(w / 1.5)); for (let i = 0; i < n; i++) rope(i * w / n + .1, (i + 1) * w / n - .1, .1, .82); for (let i = 0; i <= n; i++) post(Math.min(w - .1, Math.max(.1, i * w / n)), .1); }
function gate(p) {
  const w = p.w || 3, nm = p.name || 'GALLERY'; for (const x of [.15, w - .15]) { box(x - .12, 0, 0, .24, .24, 1.15, NAVY, { t: BRASS }); ball(x, .12, 1.25, .1, BRASS_L, { ol: false }); }
  if (!p.open) { rope(.25, w - .25, .12, 1.0); rope(.25, w - .25, .12, .62); const s = S2(w / 2, .13, .95); R.rect(s[0] - 9, s[1] - 2, 19, 9, CREAM); R.textS('TICKET', s[0] - 11 + 3, s[1], RED); }
  else { lw([.25, .12, 1.0], [.3, .12, .2], '#7a2a3a'); lit(() => { const s = S2(w - .15, .13, .9); px(s[0], s[1], C('#7df0a0')); px(s[0] + 1, s[1], C('#7df0a0')); }); }
  signY(nm, w / 2 - textW(nm) / 32 - .15, w / 2 + textW(nm) / 32 + .15, -.2, 1.45, 1.8, NAVY, BRASS_L); lw([w / 2 - .5, -.2, 1.45], [w / 2 - .5, -.2, 0], BRASS_D); lw([w / 2 + .5, -.2, 1.45], [w / 2 + .5, -.2, 0], BRASS_D);
}

/* ---------- the Foucault pendulum pit ---------- */
function pendulum(p) {
  const down = p.down || 0, cx = 2, cy = 2;
  cyl(cx, cy, 0, 1.98, .3, MARBLE, { t: lt(MARBLE, .1) }); disc(cx, cy, .3, 1.72, MARBLE_D); disc(cx, cy, .22, 1.66, NAVY); disc(cx, cy, .22, 1.2, NAVY_L, NAVY);
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, L = i % 4 === 0 ? 1.15 : i % 2 === 0 ? .8 : .45; lw([cx, cy, .221], [cx + Math.cos(a) * L, cy + Math.sin(a) * L, .221], i % 4 === 0 ? BRASS_L : BRASS_D); }
  disc(cx, cy, .222, .16, BRASS);
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2 - Math.PI / 2, x = cx + Math.cos(a) * 1.42, y = cy + Math.sin(a) * 1.42; if ((i % 12) < down / 2) { dot(x, y, .23, BRASS_D); dot(x, y, .23, BRASS_D, 1, 0); dot(x, y, .23, BRASS_D, 2, 1); } else { const s = S2(x, y, .22); for (let k = 0; k < 4; k++) px(s[0], s[1] - k, C(k === 3 ? '#ffffff' : k % 2 ? RED : CREAM)); } }
  textY('N', cx - .1, cy + 1.99, .26, NAVY);
}

/* ---------- the orrery ---------- */
const ORB = [[.42, 12, .05, '#a8a39a'], [.62, 8, .07, '#f0deb0'], [.84, 5, .08, '#4a8ae8'], [1.04, 3, .06, '#d9683a'], [1.28, 2, .14, '#e8cfa0'], [1.52, 1, .12, '#ecd9a0']];
function orrery(p) {
  const a0 = (p.a || 0) / 48 * Math.PI * 2, cx = 1.5, cy = 1.5;
  cyl(cx, cy, 0, 1.15, .7, WOOD, { t: WOOD_L }); cyl(cx, cy, .7, 1.05, .08, BRASS, { t: BRASS_L }); disc(cx, cy, .781, .9, NAVY); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; dot(cx + Math.cos(a) * .8, cy + Math.sin(a) * .8, .79, BRASS_L); }
  // crank on the front
  lw([cx + .3, cy + 1.16, .4], [cx + .3, cy + 1.36, .4], BRASS_D); lw([cx + .3, cy + 1.36, .4], [cx + .3, cy + 1.36, .56], BRASS); ball(cx + .3, cy + 1.36, .6, .05, RED, { ol: false });
  const arm = i => { const [rr, k, br, c] = ORB[i], a = a0 * k + i * 1.1, x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr, z = 1.25 + i * .09; lw([cx, cy, z], [x, y, z], BRASS_D); lw([x, y, z], [x, y, z + .12], BRASS); ball(x, y, z + .12 + br, br, c, { ol: br > .07 }); if (i === 5) { const s = PW(x, y, z + .12 + br); ellipse(s[0], s[1], 5, 1.4, '#cdb070'); } if (i === 2) dot(x + .1, y, z + .3, '#d8d4c0'); return a; };
  const order = ORB.map((o, i) => i).sort((i, j) => { const ai = a0 * ORB[i][1] + i * 1.1, aj = a0 * ORB[j][1] + j * 1.1; return (Math.cos(ai) + Math.sin(ai)) * ORB[i][0] - (Math.cos(aj) + Math.sin(aj)) * ORB[j][0]; });
  let sun = false; const drawSun = () => { cyl(cx, cy, .78, .06, 1.2, BRASS, { ol: false }); lit(() => ball(cx, cy, 2.12, .22, '#ffc23a', { t: '#fff2a8', d: '#f08a2a', ol: false })); sun = true; };
  for (const i of order) { const a = a0 * ORB[i][1] + i * 1.1; if (!sun && Math.cos(a) + Math.sin(a) > 0) drawSun(); arm(i); } if (!sun) drawSun();
}

/* ---------- counters & shelves ---------- */
function desk(p) {
  const w = p.w || 3, k = p.kind || 'ticket';
  box(0, 0, 0, w, .6, 1, NAVY, { l: (u, v) => (v < 3 ? BRASS_D : (u % 16 === 0) ? NAVY_D : NAVY), t: MARBLE }); qy(0, w, .601, .9, 1, BRASS);
  for (let x = .5; x < w - .2; x += 1) star(x, .602, .5, BRASS);
  if (k === 'ticket') { signY('TICKETS', w / 2 - .8, w / 2 + .8, .32, 1.42, 1.74, CREAM, NAVY); lw([w / 2 - .6, .32, 1.42], [w / 2 - .6, .32, 1], BRASS_D); lw([w / 2 + .6, .32, 1.42], [w / 2 + .6, .32, 1], BRASS_D); box(.2, .12, 1, .34, .3, .26, DARK); lit(() => qy(.23, .51, .421, 1.05, 1.22, '#7ad8ff')); for (let i = 0; i < 3; i++) box(w - .9 + i * .22, .15, 1, .16, .3, .04, ['#f4ead0', '#e8b83a', '#c8402f'][i], { ol: false }); }
  else if (k === 'shop') { box(.2, .12, 1, .36, .3, .22, DARK); lit(() => qy(.23, .53, .421, 1.05, 1.18, '#7df0a0')); const q = PW(w - .5, .3, 1.24); planetDisc((a, b, c) => px(a, b, C(c)), 'earth', Math.round(q[0]), Math.round(q[1]), 4); cyl(w - .5, .3, 1, .1, .06, BRASS, { ol: false }); lw([w / 2 - .2, .3, 1.05], [w / 2 + .35, .3, 1.36], '#e4e8ec'); lw([w / 2 - .2, .3, 1.02], [w / 2 + .35, .3, 1.33], '#9aa2ae'); lw([w / 2, .3, 1], [w / 2, .3, 1.14], BRASS_D); }
  else { cyl(.45, .3, 1, .18, .42, '#b8562a', { t: '#8a3a1a' }); ball(.45, .3, 1.46, .1, BRASS, { ol: false }); dot(.45, .5, 1.12, BRASS_L); for (let i = 0; i < 3; i++) { cyl(w - .95 + i * .26, .3, 1, .08, .14, i === 1 ? NAVY_L : CREAM, { ol: false }); } box(w / 2 - .12, .15, 1, .24, .26, .3, '#e8f0f4', { ol: false, t: BRASS }); for (let i = 0; i < 5; i++) dot(w / 2 - .06 + (i % 2) * .1, .42, 1.06 + i * .04, '#fff8f0'); const s = S2(.45, .3, 1.6); for (const [dx, dy] of [[0, -2], [1, -4], [0, -6], [-1, -8]]) px(s[0] + dx, s[1] + dy, C('#e8eef4')); }
}
function shelf(p) {
  const w = p.w || 3, k = p.kind || 'shop', r = rng((p.seed || 4) + w), nm = k === 'cocoa' ? 'COMET COCOA' : 'THE STAR SHOP';
  box(0, 0, 0, w, .45, 2.4, NAVY_D, { t: NAVY }); qy(.08, w - .08, .451, .1, 1.95, '#101630'); signY(textW(nm) > (w - .3) * 16 ? (k === 'cocoa' ? 'COCOA' : 'SHOP') : nm, .08, w - .08, .452, 2, 2.32, BRASS, NAVY_D, { lit: true });
  if (k === 'cocoa') { qy(.15, w - .15, .452, 1.15, 1.88, '#2a2f38'); textY('HOT COCOA', .3, .453, 1.78, CREAM); for (let i = 0; i < 4; i++) lw([.3, .453, 1.58 - i * .1], [Math.min(w - .3, 1.5 + (i % 2) * .5), .453, 1.58 - i * .1], i % 2 ? BRASS : '#b8c0cc'); if (w > 2.6) { const q = PW(w - .55, .453, 1.5); ellipse(q[0], q[1], 4, 4, '#8a4a2a'); ellipse(q[0], q[1] - 1, 3, 2, '#fff4e8'); }
    for (const z of [.72, .3]) { qy(.08, w - .08, .46, z, z + .04, BRASS_D); for (let x = .2; x < w - .2; x += .2) { const q = Math.floor(r() * 4); if (q < 2) qy(x, x + .11, .46, z + .04, z + .17, q ? CREAM : NAVY_L); else if (q === 2) qy(x, x + .12, .46, z + .04, z + .26, ['#b8562a', '#8a5a3a', '#d8b888'][Math.floor(r() * 3)]); else qy(x, x + .12, .46, z + .04, z + .12, RED); } } }
  else for (const z of [1.5, 1.08, .66, .24]) { qy(.08, w - .08, .46, z, z + .04, BRASS_D); for (let x = .2; x < w - .3; x += .27) { const q = Math.floor(r() * 6), s = PW(x + .08, .46, z + .17), X = Math.round(s[0]), Y = Math.round(s[1]);
    if (q === 0) planetDisc((a, b, c) => px(a, b, C(c)), ['earth', 'mars', 'jupiter', 'neptune'][Math.floor(r() * 4)], X, Y, 2.4); else if (q === 1) { qy(x, x + .08, .46, z + .04, z + .3, ['#4a8ae8', '#d9483b', '#8a5aa8', '#e8b83a'][Math.floor(r() * 4)]); qy(x + .09, x + .16, .46, z + .04, z + .27, CREAM); }
    else if (q === 2) { for (let i = 0; i < 6; i++) px(X, Y + 2 - i, C(i === 5 ? RED : '#f4f0e8')); px(X - 1, Y + 2, C(RED)); px(X + 1, Y + 2, C(RED)); } else if (q === 3) { ellipse(X, Y, 3, 3, '#ecd9a0'); ellipse(X, Y, 5, 1.2, '#cdb070'); } else if (q === 4) { qy(x, x + .15, .46, z + .04, z + .24, '#141a3a'); lit(() => { px(X - 1, Y - 1, C('#ffe9b0')); px(X + 1, Y + 1, C('#ffffff')); }); } else { lw([x, .46, z + .08], [x + .16, .46, z + .2], '#e4e8ec'); dot(x + .08, .46, z + .06, BRASS_D); } } }
}

/* ---------- gallery exhibits ---------- */
function meteorite(p) {
  const k = p.kind || 0, c = ['#5a5e6a', '#8a6a4a', '#b89a3a'][k];
  box(.05, .05, 0, .9, .9, .78, MARBLE, { l: PAT.stone(dk(MARBLE, .1)) }); qy(.2, .8, .951, .3, .52, NAVY); lit(() => textY(['IRON', 'STONE', 'GEM'][k], .5 - textW(['IRON', 'STONE', 'GEM'][k]) / 32, .952, .5, BRASS_L));
  ball(.5, .5, 1.02, .3, c, { squash: .7, t: lt(c, .3) }); ball(.38, .56, .98, .16, dk(c, .15), { squash: .7, ol: false });
  for (let i = 0; i < 7; i++) { const a = i * 2.4, x = .5 + Math.cos(a) * .17, y = .5 + Math.sin(a) * .15; dot(x, y, 1.08 + (i % 3) * .05, k === 2 ? (i % 2 ? '#d8e86a' : '#f4d68a') : k === 0 ? '#c2cad4' : dk(c, .4)); }
  if (k === 0) lit(() => dot(.42, .44, 1.22, '#ffffff'));
}
function gravitywell() {
  cyl(1, 1, 0, .5, .6, DARK, { t: '#3a4050' }); cyl(1, 1, .6, .98, .42, '#e8b83a', { l: '#d9a02a', r: '#b8801a' });
  for (let k = 0; k < 7; k++) disc(1, 1, 1.02 - k * .012, .94 - k * .13, mix('#ffe070', '#6a4a1a', k / 7), k % 2 ? mix('#ffe070', '#6a4a1a', (k + 1) / 7) : undefined);
  disc(1, 1, .95, .07, '#1a1420'); box(1.7, .25, .6, .22, .22, .62, RED, { t: '#e8483b' }); lw([1.7, .36, 1.2], [1.4, .5, 1.04], '#c2cad4'); lit(() => dot(1.81, .47, 1.1, '#ffe070'));
  textY('25C', 1.02, 1.99, .5, '#ffe9a0');
}
function scale(p) {
  const li = p.lit === undefined ? -1 : p.lit;
  box(.1, .3, 0, 1.1, .7, .12, '#5e6676', { t: (x, y) => ((Math.floor(x * 8) + Math.floor(y * 8)) & 1 ? '#8a94a4' : '#9aa4b4') }); box(.5, 0, 0, .4, .28, 1.85, NAVY, { t: BRASS });
  qy(.54, .86, .281, 1.0, 1.78, '#101630'); const names = ['EARTH', 'MOON', 'MARS', 'JOVE'], cols = ['#4a8ae8', '#d8d4c0', '#d9683a', '#e8cfa0'];
  names.forEach((n, i) => { const z = 1.7 - i * .18, f = () => { dot(.59, .282, z - .06, cols[i]); dot(.59, .282, z - .06, cols[i], 1, 0); dot(.59, .282, z - .06, cols[i], 0, 1); dot(.59, .282, z - .06, cols[i], 1, 1); }; if (i === li || li === 4) lit(f); else f(); if (i === li || li === 4) lit(() => lw([.66, .282, z - .08], [.84, .282, z - .08], '#7df0a0')); else lw([.66, .282, z - .08], [.84, .282, z - .08], '#3a4466'); });
  signY('SCALE', .5, .9, .285, .5, .9, CREAM, NAVY, { frame: false });
}
function rocket(p) {
  box(0, .25, 0, .7, .6, .08, DARK); ball(.35, .55, .16, .22, RED, { squash: .5 }); lw([.6, .55, .05], [1.05, .55, .05], '#3a3440'); lw([.6, .57, .05], [1.05, .57, .05], '#5a5468');
  box(.95, .3, 0, .55, .5, .22, '#e8b83a', { t: '#f4d05a' }); lw([1.22, .55, .22], [1.22, .55, .78], '#c2cad4'); lw([1.24, .55, .22], [1.24, .55, .78], '#8a94a4');
  if (!p.away) rocketShape(1.23, .55, .5);
  signY('STOMP!', 0, .9, .86, .0, .26, CREAM, RED, { frame: false });
}
export function rocketShape(x, y, z) { const s = S2(x, y, z); for (let i = 0; i < 9; i++) { const c = i < 2 ? RED : i === 4 ? '#3b6fd0' : '#f4f0e8'; px(s[0], s[1] - 9 + i, C(c)); if (i > 0) { px(s[0] - 1, s[1] - 9 + i, C(c)); px(s[0] + 1, s[1] - 9 + i, C(i < 2 ? RED : dk(c, .15))); } } px(s[0] - 2, s[1] - 1, C(RED)); px(s[0] + 2, s[1] - 1, C(RED)); px(s[0] - 2, s[1], C(RED)); px(s[0] + 2, s[1], C(RED)); }
function plaque(p) { const c = p.c || NAVY; lw([.25, .25, 0], [.25, .25, .6], BRASS_D); lw([.27, .25, 0], [.27, .25, .6], BRASS); fq([[.02, .3, .55], [.48, .3, .55], [.48, .12, .8], [.02, .12, .8]], c); lw([.02, .3, .55], [.48, .3, .55], BRASS_L); for (let i = 0; i < 3; i++) lw([.08, .26 - i * .05, .6 + i * .07], [.4 - (i % 2) * .1, .26 - i * .05, .6 + i * .07], CREAM); }
function hang(p) {
  const k = p.kind || 'jupiter', r = p.r || 8, s = S2(.5, .5, 0); for (let i = 0; i < 26; i += 1) px(s[0], s[1] - r - i, C(i % 2 ? '#8a8a94' : '#6a6a78'));
  if (k === 'comet') { lit(() => { for (let i = 0; i < 26; i++) { const yy = s[1] + (i >> 2); px(s[0] - i, yy, C(i < 4 ? '#ffffff' : i < 12 ? '#c8e8ff' : '#7aa8e8')); if (i > 1 && i < 20) px(s[0] - i, yy + 1, C(i < 9 ? '#a8d8ff' : '#5a8ad8')); if (i > 3 && i < 14 && i % 2) px(s[0] - i, yy - 1, C('#e8f4ff')); if (i > 6 && i % 3 === 0) px(s[0] - i, yy + 2, C('#4a6ab8')); } ellipse(s[0] + 1, s[1], 3, 3, '#ffffff'); ellipse(s[0] + 1, s[1], 1.5, 1.5, '#fff8d0'); }); return; }
  planetDisc((a, b, c) => px(a, b, C(c)), k, s[0], s[1], r, { t: p.t || 0 });
}
function bench() { for (const x of [.15, 1.35]) { box(x, .1, 0, .1, .4, .3, BRASS_D, { ol: false }); } box(0, 0, .3, 1.6, .6, .16, NAVY_L, { t: (x, y) => (Math.abs((x * 16) % 12.8 - 6) < .6 && Math.abs(y - .3) < .05 ? BRASS : '#3a4a86') }); }
function lamp() { cyl(.25, .25, 0, .16, .06, BRASS_D); cyl(.25, .25, .06, .035, 2.1, BRASS, { ol: false }); glow(() => ball(.25, .25, 2.38, .34, '#ffe9a0', { ol: false })); ball(.25, .25, 2.38, .22, '#fff4dc', { t: '#ffffff', d: '#e8d8a8' }); cyl(.25, .25, 2.14, .1, .05, BRASS_L, { ol: false }); }
function column(p) { const h = p.h || 4.4; box(0, 0, 0, .7, .7, .3, MARBLE); cyl(.35, .35, .3, .26, h - .7, MARBLE, { l: lt(MARBLE, .05), r: MARBLE_D }); for (const dx of [-.12, 0, .12]) lw([.35 + dx, .35 + .2, .35], [.35 + dx, .35 + .2, h - .45], MARBLE_D); box(-.05, -.05, h - .4, .8, .8, .4, MARBLE, { t: lt(MARBLE, .1) }); qy(-.05, .75, .751, h - .4, h - .32, BRASS); }
function stairs() {
  const n = 7; for (let i = n - 1; i >= 0; i--) { const y0 = 2.5 - (i + 1) * .34, h = (i + 1) * .3; box(.25, y0, 0, 1.9, .34, h, MARBLE, { t: i % 2 ? '#7a2a3a' : '#8a3444', l: MARBLE_D }); }
  for (const x of [.25, 2.15]) { for (let i = 0; i <= n; i += 1) { const y = 2.5 - i * .34, z = i * .3; lw([x, y, z], [x, y, z + .8], BRASS_D); } lw([x, 2.5, .8], [x, 2.5 - n * .34, n * .3 + .8], BRASS_L); lw([x, 2.5, .76], [x, 2.5 - n * .34, n * .3 + .76], BRASS); }
  box(0, 2.4, 0, .22, .22, 2.6, NAVY, { t: BRASS }); box(2.28, 2.4, 0, .22, .22, 2.6, NAVY, { t: BRASS }); signY('DOME & TERRACE', 0, 2.5, 2.62, 2.25, 2.62, NAVY, BRASS_L, { lit: true }); lit(() => { const s = S2(1.25, 2.62, 2.14); for (const d of [-2, -1, 0, 1, 2]) px(s[0] + d, s[1] + Math.abs(d), C(BRASS_L)); });
}
function theatredoor(p) {
  const t = p.t || '';
  box(0, 0, 0, 3, .4, 3.2, NAVY_D, { t: BRASS }); qy(.3, 2.7, .401, 0, 2.3, BRASS); qy(.36, 1.48, .402, 0, 2.24, TEAL); qy(1.52, 2.64, .402, 0, 2.24, TEAL);
  for (const x of [.92, 2.08]) { const q = PW(x, .403, 1.55); ellipse(q[0], q[1], 5, 5, BRASS_D); ellipse(q[0], q[1], 4, 4, '#141a3a'); glow(() => ellipse(q[0], q[1], 4, 4, '#3a4a9a')); lit(() => { px(q[0] - 1, q[1] - 1, C('#ffe9b0')); px(q[0] + 2, q[1] + 1, C('#ffffff')); }); }
  for (const x of [1.4, 1.6]) lw([x, .403, .9], [x, .403, 1.3], BRASS_L);
  signY('PLANETARIUM', .08, 2.92, .402, 2.42, 2.82, '#101630', '#ffe9b0', { lit: true }); lit(() => { for (let x = .4; x < 2.7; x += .25) dot(x, .403, 2.92, (Math.round(x * 4) % 2) ? '#ffe070' : '#ffffff'); });
  if (t) { box(3.1, .1, 0, .08, .08, 1.3, BRASS_D, { ol: false }); box(2.8, .08, 1.3, .7, .1, .62, DARK); lit(() => { qy(2.84, 3.46, .181, 1.34, 1.88, '#101630'); textY('NEXT', 2.9, .182, 1.84, '#7ad8ff'); textY(t, 2.86, .182, 1.6, '#ffe070'); }); }
}
function board(p) {
  const s = String(p.s || ''); for (const x of [.15, 1.95]) box(x, .1, 0, .1, .1, 1.6, WOOD, { ol: false }); box(0, .08, .55, 2.2, .1, 1.1, WOOD); qy(.07, 2.13, .181, .62, 1.58, '#c9a26a');
  textY('MOON', .86, .182, 1.57, WOOD);
  for (let i = 0; i < Math.min(6, s.length); i++) { const x = .18 + (i % 3) * .66, z = 1.36 - Math.floor(i / 3) * .42 - (i % 2) * .03; qy(x, x + .54, .183, z - .36, z, '#f4f0e8'); const q = PW(x + .27, .184, z - .19); ellipse(q[0], q[1], 3.6, 3.6, '#3a4058'); moonDisc((a, b, c) => px(a, b, C(c)), Math.round(q[0]), Math.round(q[1]), 3, (+s[i] || 0) / 8, { c: '#f4f0dc', c2: '#a8a594' }); dot(x + .27, .184, z, RED); }
  if (!s.length) { qy(.4, 1.8, .183, .9, 1.2, '#f4f0e8'); textY('YOURS?', .72, .184, 1.12, '#8a8a94'); }
}
function lectern() { box(.15, .1, 0, .5, .4, 1.0, WOOD, { t: WOOD_L }); fq([[.1, .52, 1.0], [.7, .52, 1.0], [.7, .08, 1.2], [.1, .08, 1.2]], WOOD_L); qy(.25, .55, .501, .4, .7, NAVY); star(.4, .502, .55, BRASS_L); lit(() => dot(.62, .3, 1.24, '#ffe070')); }
function screen(p) {
  const sl = p.slide || 0; for (const x of [.1, 1.9]) lw([x, .1, 0], [x, .1, 2.2], '#5e6676'); lw([.1, .1, 2.2], [1.9, .1, 2.2], '#3a3440'); box(.05, .06, 2.14, 1.9, .1, .1, '#3a3440', { ol: false });
  const f = () => { qy(.14, 1.86, .11, .9, 2.14, sl ? '#141a3a' : '#f4f0e8'); const q = PW(1, .12, 1.52), X = Math.round(q[0]), Y = Math.round(q[1]), pt = (a, b, c) => px(a, b, C(c));
    if (sl === 1) { moonDisc(pt, X, Y, 8, .5, { detail: 1 }); } else if (sl === 2) { planetDisc(pt, 'saturn', X, Y, 5); } else if (sl === 3) { for (let i = 0; i < 40; i++) { const a = i * .5, rr = i * .32; px(X + Math.round(Math.cos(a) * rr), Y + Math.round(Math.sin(a) * rr * .6), C(i < 8 ? '#fff4d0' : '#a8b8f0')); } } else { textY('TALKS', .68, .12, 1.8, NAVY); textY('15 & 17', .56, .12, 1.4, RED); } };
  if (sl) lit(f); else f();
}
function globe(p) { const k = p.kind || 'moon'; cyl(.5, .5, 0, .3, .08, BRASS_D); cyl(.5, .5, .08, .05, .5, BRASS, { ol: false }); const q = PW(.5, .5, 1.02), X = Math.round(q[0]), Y = Math.round(q[1]), pt = (a, b, c) => px(a, b, C(c)); ellipse(X, Y, 9, 9, DARK); if (k === 'moon') moonDisc(pt, X, Y, 8, .5, { detail: 1 }); else planetDisc(pt, k, X, Y, 8); for (let i = -9; i <= 9; i++) { px(X + i, Y + Math.round(Math.sqrt(Math.max(0, 81 - i * i)) * .35) + 1, C(i % 3 ? BRASS : BRASS_L)); } }
function scopecase() { box(0, 0, 0, 1.6, .7, .6, NAVY, { t: '#7a2a3a' }); lw([.25, .35, .78], [1.3, .35, 1.05], BRASS_L); lw([.25, .35, .75], [1.3, .35, 1.02], BRASS); lw([.25, .35, .72], [1.3, .35, .99], BRASS_D); lw([.7, .35, .62], [.7, .35, .86], BRASS_D); lw([.55, .35, .62], [.7, .35, .8], BRASS_D); lw([.85, .35, .62], [.7, .35, .8], BRASS_D);
  qy(0, 1.6, .7, .6, 1.3, '#cfe9f4', 'glass'); qx(1.6, 0, .7, .6, 1.3, '#b8dcec', 'glass'); for (const [a, b] of [[[0, .7, .6], [0, .7, 1.3]], [[1.6, .7, .6], [1.6, .7, 1.3]], [[0, .7, 1.3], [1.6, .7, 1.3]], [[1.6, 0, 1.3], [1.6, .7, 1.3]], [[0, 0, 1.3], [1.6, 0, 1.3]], [[0, 0, 1.3], [0, .7, 1.3]]]) lw(a, b, BRASS); qy(.3, 1.3, .701, .2, .42, BRASS); textY('1894', .62, .702, .4, NAVY_D); }

const T = ['observatory', 'obs'];
const A = (id, tags, size, draw, x) => Object.assign({ id: 'furn.obs.' + id, kind: 'furniture', tags: T.concat(tags), size, draw, variants: [{}] }, x);
export default [
  A('wallpanel', ['wall'], p => [p.w || 4, .12, HW], wallpanel, { wall: true, mount: 0, solid: false, vb: p => [0, 0, 0, p.w || 4, .2, HW + .1], variants: [{ w: 4, kind: 'plain' }, { w: 6, kind: 'const', a: 'orion', b: 'ursa' }, { w: 10, kind: 'planets' }, { w: 8, kind: 'moonwall', phase: 3 }, { w: 4, kind: 'window', time: 'night' }, { w: 4, kind: 'window', time: 'day' }, { w: 2, kind: 'poster', prog: 1 }, { w: 2, kind: 'poster', prog: 4 }] }),
  A('rail', ['barrier'], p => [p.w || 3, .2, 1], rail, { variants: [{ w: 3 }, { w: 5.5 }] }),
  A('gate', ['obs_gate'], p => [p.w || 3, .3, 1.2], gate, { solid: false, vb: p => [-.1, -.4, 0, (p.w || 3) + .1, .5, 1.9], variants: [{}, { open: 1 }] }),
  A('pendulum', ['obs_pendulum'], [4, 4, .32], pendulum, { use: { x: 2, y: 4.5 }, variants: [{ down: 0 }, { down: 9 }] }),
  A('orrery', ['obs_orrery'], [3, 3, 1.4], orrery, { use: { x: 1.8, y: 3.5 }, frames: 48, vb: [-.5, -.5, 0, 3.5, 3.5, 2.6], variants: [{ a: 0 }, { a: 7 }, { a: 20 }] }),
  A('desk', ['counter'], p => [p.w || 3, .6, 1.05], desk, { use: p => ({ x: (p.w || 3) / 2, y: 1.1 }), staff: p => ({ x: (p.w || 3) / 2, y: -.45, dir: 1 }), vb: p => [-.1, -.1, 0, (p.w || 3) + .1, .8, 1.9], variants: [{ kind: 'ticket', w: 2.5 }, { kind: 'shop' }, { kind: 'cocoa' }] }),
  A('shelf', ['shelf_unit'], p => [p.w || 3, .45, 2.4], shelf, { variants: [{ kind: 'shop' }, { kind: 'cocoa', w: 4 }] }),
  A('meteorite', ['obs_meteorite'], [1, 1, 1.3], meteorite, { use: { x: .5, y: 1.4 }, variants: [{ kind: 0 }, { kind: 1 }, { kind: 2 }] }),
  A('gravitywell', ['obs_well'], [2, 2, 1.05], gravitywell, { use: { x: 1, y: 2.4 }, vb: [-.1, -.1, 0, 2.2, 2.2, 1.4] }),
  A('scale', ['obs_scale'], [1.4, 1, 1.9], scale, { use: { x: .65, y: 1.4 }, pose: { x: .65, y: .65, z: .12, dir: 1 }, variants: [{}, { lit: 2 }] }),
  A('rocket', ['obs_rocket'], [1.6, 1, .8], rocket, { use: { x: .35, y: 1.3 }, vb: [-.1, -.1, 0, 1.7, 1.1, 1.5], variants: [{}, { away: 1 }] }),
  A('plaque', ['obs_plaque'], [.5, .5, .8], plaque, { solid: false, use: { x: .25, y: .85 }, variants: [{}, { c: '#b8862c' }] }),
  A('hang', ['model'], [1, 1, .2], hang, { solid: false, overhead: true, vb: [-2.4, -2.4, -1.2, 3.4, 3.4, 2.4], variants: [{ kind: 'jupiter', r: 10 }, { kind: 'saturn', r: 7 }, { kind: 'earth', r: 5 }, { kind: 'mars', r: 4 }, { kind: 'comet' }] }),
  A('bench', ['obs_bench'], [1.6, .6, .5], bench, { seats: p => [{ x: .45, y: .32, z: .46, dir: p.rev ? 3 : 1 }, { x: 1.15, y: .32, z: .46, dir: p.rev ? 3 : 1 }], use: { x: .8, y: 1.1 } }),
  A('lamp', ['lamp'], [.5, .5, 2.7], lamp, { light: { x: .25, y: .25, z: 0, r: 3.6 } }),
  A('column', ['pillar'], p => [.7, .7, p.h || 4.4], column, {}),
  A('stairs', ['obs_stairs'], [2.5, 2.5, 2.6], stairs, { use: { x: 1.25, y: 3 }, vb: [-.1, -.1, 0, 2.6, 2.7, 3.2] }),
  A('theatredoor', ['obs_theatre'], [3, .4, 3.2], theatredoor, { use: { x: 1.5, y: 1.1 }, vb: [-.1, -.1, 0, 3.7, .6, 3.3], variants: [{ t: '18:00' }, {}] }),
  A('board', ['obs_board'], [2.2, .3, 1.7], board, { use: { x: 1.1, y: .8 }, variants: [{ s: '' }, { s: '13467' }] }),
  A('lectern', ['obs_lectern'], [.8, .6, 1.25], lectern, { staff: { x: .4, y: -.4, dir: 1 }, use: { x: .4, y: 1.1 } }),
  A('screen', ['obs_screen'], [2, .2, 2.3], screen, { solid: false, variants: [{ slide: 0 }, { slide: 1 }, { slide: 2 }, { slide: 3 }] }),
  A('globe', ['decor'], [1, 1, 1.6], globe, { variants: [{ kind: 'moon' }, { kind: 'earth' }, { kind: 'mars' }] }),
  A('scopecase', ['decor'], [1.6, .7, 1.3], scopecase, {}),
];
