// Lobby fixtures (apartment + office lobbies, see scenes/rooms/lobbies.js). ids `furn.lobby.*`.
// Wall pieces (wall: true): mailboxes, lift, stairs, restroom, board, panel, sconce, intercom, timeclock.
// Floor pieces: desk, podium, turnstile, rail, packages, coffeebar, column, bike, umbrella, settee.   Flat / overhead: inlay, chandelier.
import { box, qy, qx, qz, lw, fq, glow, lit, cyl, ball, dk, lt, mix, PAT, textY, signY, spx, hash2 } from '../../engine/raster.js';
import { F, K, bx, tube, post, frameY, frameZ, table, monitor, plant, carton, lamp, screenLines, PX } from './_lib.js';

const METAL = { brass: '#d8a848', steel: '#b8bcc0', bronze: '#9a6a3a', black: '#3a3f4c', copper: '#c0704a', white: '#e8e4dc' };
const mt = (p, d) => METAL[p.m] || p.m || METAL[d || 'brass'];
const arcY = (cx, y, cz, r, a0, a1, n) => { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + Math.cos(a) * r, y, cz + Math.sin(a) * r]); } return o; };
const discY = (cx, y, cz, r, c) => fq(arcY(cx, y, cz, r, 0, Math.PI * 2, 14), c);
const W = (o) => Object.assign({ wall: true, mount: 0, solid: false }, o);
const NOTE = ['#f8f4ea', '#f2c230', '#e87aa0', '#9ccc4a', '#6fb6d8', '#e8843a', '#f8f4ea', '#c8b8e8'];

/* ---------- wall pieces ---------- */
function mailboxes(p) {
  const w = p.w || 2, c = mt(p), rows = p.rows || 3, z0 = p.z0 || .75, ch = .26, cols = Math.max(2, Math.round((w - .16) / .3)), cw = (w - .16) / cols, z1 = z0 + rows * ch;
  bx(0, 0, z0 - .12, w, .1, z1 - z0 + .3, dk(c, .35)); qy(0, w, .1, z0 - .12, z1 + .18, dk(c, .22));
  for (let r = 0; r < rows; r++) for (let i = 0; i < cols; i++) {
    const x = .08 + i * cw, z = z0 + r * ch, k = hash2(i, r, p.seed || 3);
    qy(x + PX, x + cw - PX, .11, z + PX, z + ch - PX, k > .8 ? lt(c, .12) : c); frameY(x + PX, x + cw - PX, .11, z + PX, z + ch - PX, dk(c, .45));
    lw([x + .07, .11, z + ch - .09], [x + cw - .07, .11, z + ch - .09], '#f4f0e8'); spx(x + cw / 2, .11, z + .08, 0, 0, '#2a2733'); if (k < .14) qy(x + .06, x + cw - .08, .12, z + ch - .06, z + ch + .02, '#f8f4ea');
  }
  qy(.08, w - .08, .11, z0 - .1, z0 - .02, '#2a2733'); lw([.08, .11, z0 - .02], [w - .08, .11, z0 - .02], lt(c, .3));
  signY(p.text || 'MAIL', w / 2 - .45, w / 2 + .45, .11, z1 + .02, z1 + .16, dk(c, .5), lt(c, .5), { frame: false });
}
function liftDoors(x0, x1, y, z1, p, c) {
  const st = p.style || 'steel', mid = (x0 + x1) / 2;
  if (st === 'cage') {
    qy(x0, x1, y, 0, z1, '#2a2430'); glow(() => qy(x0 + .1, x1 - .1, y, .1, z1 - .1, '#5a4030', '#6a4a34')); const b = mt(p);
    for (let x = x0; x <= x1 + .001; x += .14) lw([x, y + .01, 0], [x, y + .01, z1], dk(b, .2));
    for (let x = x0; x < x1 - .1; x += .28) { lw([x, y + .01, .3], [x + .14, y + .01, .9], b); lw([x + .14, y + .01, .9], [x + .28, y + .01, .3], b); lw([x, y + .01, 1.5], [x + .14, y + .01, .9], b); lw([x + .14, y + .01, .9], [x + .28, y + .01, 1.5], b); }
    lw([x0, y + .01, 1.5], [x1, y + .01, 1.5], b); lw([x0, y + .01, .3], [x1, y + .01, .3], b); frameY(x0, x1, y + .01, 0, z1, dk(b, .4)); return;
  }
  if (st === 'glass') {
    qy(x0, x1, y, 0, z1, '#bfe4ee', '#cfeef4'); glow(() => qy(x0, x1, y, 0, z1, '#ffe6a0', '#ffd98a')); lw([x0, y, z1 * .55], [x1, y, z1 * .55], '#eefafc');
    for (const k of [.2, .68]) lw([x0 + (x1 - x0) * k, y, z1 * .9], [x0 + (x1 - x0) * k + .22, y, z1 * .5], '#f4fbfc'); frameY(x0, x1, y, 0, z1, c); lw([mid, y, 0], [mid, y, z1], c); return;
  }
  if (st === 'freight') {
    qy(x0, x1, y, 0, z1, '#7d858e'); for (let z = .2; z < z1; z += .2) lw([x0, y, z], [x1, y, z], '#6a7078');
    qy(x0, x1, y, z1 / 2 - .08, z1 / 2 + .08, (u, v) => ((u + v) >> 2) & 1 ? '#f2c230' : '#2a2733'); frameY(x0, x1, y, 0, z1, '#4a4f5c'); tube([mid - .15, y + .02, z1 / 2 - .2], [mid + .15, y + .02, z1 / 2 - .2], '#2a2733'); return;
  }
  const dc = p.dc || (st === 'deco' ? mt(p) : '#c4c9ce');
  qy(x0, x1, y, 0, z1, dc, st === 'deco' ? lt(dc, .12) : '#b8bcc0'); frameY(x0, x1, y, 0, z1, dk(dc, .5)); lw([mid, y, 0], [mid, y, z1], dk(dc, .55)); lw([mid - PX, y, 0], [mid - PX, y, z1], lt(dc, .4));
  if (st === 'deco') { for (const s of [-1, 1]) { const cx = mid + s * (x1 - x0) / 4; for (let k = 0; k < 4; k++) { lw([cx, y, .25 + k * .22], [cx - .22, y, .5 + k * .22], dk(dc, .35)); lw([cx, y, .25 + k * .22], [cx + .22, y, .5 + k * .22], dk(dc, .35)); } fq(arcY(cx, y, z1 - .42, .2, 0, Math.PI, 8), lt(dc, .35)); for (let k = 1; k < 6; k++) lw([cx, y, z1 - .42], [cx + Math.cos(k * Math.PI / 6) * .2, y, z1 - .42 + Math.sin(k * Math.PI / 6) * .2], dk(dc, .3)); } }
  else for (const x of [x0 + .08, mid + .08]) frameY(x, x + (x1 - x0) / 2 - .16, y, .2, z1 - .2, lt(dc, .25));
}
function lift(p) {
  const st = p.style || 'steel', c = p.c || (st === 'deco' ? '#3a3440' : st === 'cage' ? '#5a4030' : st === 'freight' ? '#5a6272' : '#8a8478'), b = mt(p, st === 'deco' || st === 'cage' ? 'brass' : 'steel');
  qy(0, 1.6, .04, 0, 2.45, c);
  if (st === 'deco') { qy(.08, 1.52, .05, 2.02, 2.4, dk(c, .15)); for (const [a, z] of [[.02, 2.45], [.1, 2.52]]) qy(a, 1.6 - a, .04, z, z + .08, b); frameY(.06, 1.54, .05, 0, 2.42, b); }
  liftDoors(.2, 1.4, .06, 2.0, p, st === 'glass' ? '#7d858e' : c);
  if (st === 'deco' || st === 'cage') { fq(arcY(.8, .06, 2.08, .28, 0, Math.PI, 10), '#f4ead0'); lw([.52, .06, 2.08], [1.08, .06, 2.08], dk(b, .3)); for (let k = 0; k <= 4; k++) spx(.8 + Math.cos(Math.PI * k / 4) * .22, .06, 2.08 + Math.sin(Math.PI * k / 4) * .22, 0, 0, '#3a3040'); const a = Math.PI * (.2 + .6 * hash2(p.floor || 2, 5)); lw([.8, .06, 2.09], [.8 + Math.cos(a) * .2, .06, 2.09 + Math.sin(a) * .2], '#b8342e'); }
  else lit(() => { qy(.55, 1.05, .06, 2.1, 2.32, '#1e2028'); textY(String(p.floor || 1), .7, .06, 2.3, st === 'freight' ? '#5af08a' : '#ff8a40'); spx(.98, .06, 2.2, 0, 0, '#5af08a'); spx(.98, .06, 2.2, 1, 1, '#5af08a'); spx(.98, .06, 2.2, -1, 1, '#5af08a'); });
  qy(1.45, 1.55, .06, .9, 1.2, b); lit(() => spx(1.5, .06, 1.1, 0, 0, '#f6e04a')); spx(1.5, .06, .98, 0, 0, '#2a2733');
}
function stairs(p) {
  const c = p.c || '#6a5a4a', op = p.open;
  qy(0, 1.2, .04, 0, 2.0, c);
  if (op) {
    qy(.1, 1.1, .05, 0, 1.9, '#2a2430'); glow(() => qy(.1, 1.1, .05, 0, 1.9, '#4a3c34', '#54443a'));
    for (let i = 0; i < 6; i++) { const z = i * .17, x = .1 + i * .1; qy(x, 1.1, .055, z, z + .17, i % 2 ? '#8a7a68' : '#9a8a76'); lw([x, .055, z + .17], [1.1, .055, z + .17], '#5a4a3c'); }
    lw([.14, .06, .8], [.74, .06, 1.82], p.rail || '#3a3040'); lw([.14, .06, .0], [.14, .06, .8], p.rail || '#3a3040'); frameY(.1, 1.1, .05, 0, 1.9, dk(c, .45));
    if (p.arch) { fq(arcY(.6, .05, 1.9, .5, 0, Math.PI, 8), '#2a2430'); for (const q of [arcY(.6, .05, 1.9, .5, 0, Math.PI, 8)]) for (let i = 0; i < q.length - 1; i++) lw(q[i], q[i + 1], dk(c, .45)); }
  } else {
    const dc = p.dc || '#8a9aa8'; qy(.1, 1.1, .05, 0, 1.9, dc); frameY(.1, 1.1, .05, 0, 1.9, dk(dc, .45)); qy(.32, .88, .05, 1.0, 1.6, '#3a4a5a', '#44566a'); frameY(.32, .88, .05, 1.0, 1.6, dk(dc, .5));
    for (let i = 0; i < 4; i++) lw([.36 + i * .12, .055, 1.06 + i * .12], [.48 + i * .12, .055, 1.06 + i * .12], '#c8d4dc'); qy(.14, 1.06, .05, 0, .16, dk(dc, .3)); tube([.98, .06, .85], [.98, .06, 1.05], '#d8dade');
  }
  lit(() => signY(p.text || 'STAIRS', .12, 1.08, .05, 2.04, 2.22, p.sc || '#2f9a5a', '#f4fbfc', { frame: false }));
}
function restroom(p) {
  const c = p.c || '#6a7078', dc = p.dc || '#e4e0d8';
  qy(0, 1, .04, 0, 1.95, c); qy(.08, .92, .05, 0, 1.86, dc); frameY(.08, .92, .05, 0, 1.86, dk(dc, .45)); qy(.08, .92, .05, 0, .16, '#8a9098');
  qy(.3, .7, .055, 1.08, 1.56, '#3c64ad'); spx(.42, .055, 1.44, 0, 0, '#f4fbfc'); lw([.42, .055, 1.36], [.42, .055, 1.16], '#f4fbfc'); spx(.58, .055, 1.44, 0, 0, '#f4fbfc'); lw([.58, .055, 1.36], [.58, .055, 1.16], '#f4fbfc'); lw([.54, .055, 1.22], [.62, .055, 1.22], '#f4fbfc'); lw([.5, .055, 1.5], [.5, .055, 1.12], '#9ab4dc');
  tube([.84, .06, .85], [.84, .06, 1.0], '#d8dade'); lit(() => signY('WC', .25, .75, .05, 1.98, 2.16, '#3c64ad', '#f4fbfc', { frame: false }));
}
function board(p) {
  const w = p.w || 1.5, k = p.kind || 'cork', z0 = 1.0, z1 = 1.95, sd = p.seed || 1;
  if (k === 'cork') {
    bx(0, 0, z0, w, .05, z1 - z0, '#8a5a3a'); qy(.06, w - .06, .05, z0 + .06, z1 - .06, (u, v) => hash2(u, v, 4) > .86 ? '#b08050' : '#c89a62');
    const n = Math.round(w * 4.5); for (let i = 0; i < n; i++) { const x = .1 + hash2(i, sd, 1) * (w - .42), z = z0 + .1 + hash2(i, sd, 2) * (z1 - z0 - .44), ww = .14 + hash2(i, sd, 3) * .12, hh = .14 + hash2(i, sd, 6) * .12, cc = NOTE[Math.floor(hash2(i, sd, 8) * NOTE.length)]; qy(x, x + ww, .055, z, z + hh, cc); lw([x + .03, .055, z + hh - .05], [x + ww - .03, .055, z + hh - .05], dk(cc, .4)); if (hh > .2) lw([x + .03, .055, z + hh - .1], [x + ww - .05, .055, z + hh - .1], dk(cc, .4)); spx(x + ww / 2, .055, z + hh, 0, 0, i % 2 ? '#d63a3a' : '#3c64ad'); }
  } else if (k === 'felt') {
    const fr = mt(p); bx(0, 0, z0 - .2, w, .06, z1 - z0 + .35, fr); qy(.07, w - .07, .06, z0 - .13, z1 + .08, '#1e2028');
    signY(p.title || 'DIRECTORY', .12, w - .12, .06, z1 - .1, z1 + .05, '#1e2028', lt(fr, .4), { frame: false });
    for (let r = 0, z = z1 - .16; z > z0 - .08; z -= .09, r++) { const l = (.35 + hash2(r, sd, 2) * .5) * (w - .5); lw([.14, .06, z], [.14 + l, .06, z], '#e8e4dc'); lw([w - .28, .06, z], [w - .14, .06, z], lt(fr, .3)); }
  } else if (k === 'digital') {
    bx(0, 0, z0 - .25, w, .06, z1 - z0 + .4, '#2a2733'); lit(() => { qy(.05, w - .05, .06, z0 - .2, z1 + .1, p.c || '#1b3a5a', p.c2); qy(.05, w - .05, .06, z1 - .06, z1 + .1, p.a || '#3aa0c8'); for (let r = 0, z = z1 - .16; z > z0 - .14; z -= .1, r++) { const l = (.35 + hash2(r, sd, 2) * .45) * (w - .5); lw([.12, .06, z], [.12 + l, .06, z], r % 4 === 0 ? '#ffd070' : '#d8eef8'); lw([w - .26, .06, z], [w - .12, .06, z], '#8ad0f0'); } });
  } else { // safety / notices behind glass
    bx(0, 0, z0, w, .05, z1 - z0, '#d8dade'); qy(.05, w - .05, .05, z0 + .05, z1 - .05, '#f4f0e8'); signY(p.title || 'SAFETY', .08, w - .08, .05, z1 - .24, z1 - .07, p.c || '#2f8a55', '#f4fbfc', { frame: false });
    const n = Math.max(2, Math.round(w / .45)); for (let i = 0; i < n; i++) { const x = .1 + i * (w - .2) / n; qy(x, x + (w - .2) / n - .06, .055, z0 + .1, z1 - .3, i % 3 === 1 ? '#f2c230' : '#ffffff'); screenLines(x + .03, x + (w - .2) / n - .09, .055, z0 + .12, z1 - .34, '#6a7078', i + sd); if (i % 3 === 1) fq([[x + .08, .056, z0 + .16], [x + .28, .056, z0 + .16], [x + .18, .056, z0 + .36]], '#2a2733'); }
    frameY(0, w, .05, z0, z1, '#8a9098');
  }
}
function panel(p) {
  const w = p.w || 2, k = p.kind || 'wood', c = p.c || '#8a5a3a', c2 = p.c2 || K.brass;
  if (k === 'wood') { const z1 = p.h || 1.3; qy(0, w, .03, .22, z1, c); const n = Math.max(1, Math.round(w / .7)); for (let i = 0; i < n; i++) { const a = i * w / n + .08, b = (i + 1) * w / n - .08; frameY(a, b, .03, .34, z1 - .12, dk(c, .35)); lw([a, .03, z1 - .12 - PX], [b, .03, z1 - .12 - PX], lt(c, .15)); } qy(0, w, .03, z1, z1 + .08, lt(c, .2)); lw([0, .03, z1 + .08], [w, .03, z1 + .08], dk(c, .4)); }
  else if (k === 'sunburst') { const cx = w / 2, z = .9, r = Math.min(w / 2 - .1, 1.3); qy(0, w, .03, .3, 2.5, c); fq(arcY(cx, .035, z, r, 0, Math.PI, 16), dk(c, .2)); for (let i = 0; i <= 12; i++) { const a = Math.PI * i / 12, q = i % 2 ? r * .78 : r; lw([cx, .04, z], [cx + Math.cos(a) * q, .04, z + Math.sin(a) * q], c2); } fq(arcY(cx, .04, z, r * .32, 0, Math.PI, 10), c2); fq(arcY(cx, .04, z, r * .2, 0, Math.PI, 8), lt(c2, .4)); for (const s of [0, 1]) for (let i = 0; i < 3; i++) { const x = s ? w - .1 - i * .1 : .1 + i * .1; lw([x, .035, .3], [x, .035, 2.3 - i * .25], c2); } lw([0, .035, 2.5], [w, .035, 2.5], c2); lw([0, .035, .3], [w, .035, .3], c2); }
  else if (k === 'relief') { qy(0, w, .03, .3, 2.5, c); for (let i = 0; i < Math.round(w * 3); i++) for (let j = 0; j < 6; j++) { const h = hash2(i, j, p.seed || 2), x = i / 3, z = .36 + j * .35; if (h > .45) { qy(x + .03, x + .3, .035, z, z + .3, h > .8 ? lt(c, .16) : dk(c, .12)); lw([x + .03, .035, z], [x + .3, .035, z], dk(c, .35)); if (h > .9) qy(x + .1, x + .22, .04, z + .08, z + .22, c2); } } }
  else if (k === 'marble') { qy(0, w, .03, .25, 2.5, (u, v) => { const t = hash2((u + v * 2) >> 3, (u - v) >> 4, p.seed || 1); return (u + ((v * 3) >> 1)) % 23 === 0 || t > .93 ? dk(c, .22) : t < .1 ? lt(c, .2) : c; }); for (let x = 0; x <= w + .01; x += Math.max(.8, w / Math.round(w))) lw([Math.min(x, w), .03, .25], [Math.min(x, w), .03, 2.5], dk(c, .3)); lw([0, .035, 2.5], [w, .035, 2.5], c2); lw([0, .035, .25], [w, .035, .25], c2); }
  else if (k === 'logo') { const z0 = p.z0 || 1.35; bx(0, 0, z0, w, .06, .62, c); glow(() => qy(0, w, .07, z0 - .04, z0, '#ffe6a0')); lit(() => signY(p.name || 'MAPLE CO', .08, w - .08, .06, z0 + .16, z0 + .46, c, c2, { frame: false })); lw([.1, .06, z0 + .1], [w - .1, .06, z0 + .1], c2); lw([.1, .06, z0 + .52], [w - .1, .06, z0 + .52], c2); }
  else if (k === 'screens') { const n = Math.max(2, Math.round(w / .8)), sw = w / n; bx(0, 0, 1.0, w, .05, 1.2, '#1e2028'); lit(() => { for (let i = 0; i < n; i++) for (let j = 0; j < 2; j++) { const h = hash2(i, j, p.seed || 4), cc = ['#3a6ea5', '#c0563a', '#3f8a55', '#d8a848', '#7a55b0', '#2f8f8a'][Math.floor(h * 6)], x = i * sw + .05, z = 1.06 + j * .58; qy(x, x + sw - .1, .05, z, z + .5, cc, lt(cc, .2)); if (h > .5) { discY(x + sw * .3, .055, z + .3, .09, '#f0c8a0'); qy(x + sw * .18, x + sw * .42, .055, z, z + .2, dk(cc, .4)); } else screenLines(x + .05, x + sw - .16, .055, z + .06, z + .44, '#f4fbfc', i + j * 3); qy(x, x + sw - .1, .055, z, z + .07, '#b8342e'); } }); }
  else if (k === 'onair') { bx(0, 0, 2.0, w, .08, .32, '#2a2733'); lit(() => signY(p.name || 'ON AIR', .05, w - .05, .08, 2.04, 2.28, '#b8342e', '#fff2c4', { frame: false })); glow(() => qy(0, w, .09, 1.96, 2.0, '#ff8a70')); }
  else if (k === 'chart') { bx(0, 0, 1.0, w, .04, 1.1, '#6a4a30'); qy(.06, w - .06, .04, 1.06, 2.04, '#cfe2e6'); fq([[.06, .045, 1.06], [w * .45, .045, 1.06], [w * .35, .045, 1.4], [w * .5, .045, 1.75], [w * .3, .045, 2.04], [.06, .045, 2.04]], '#e8dcb8'); for (let i = 0; i < 7; i++) lw([w * .5 + i * .1, .045, 1.1 + hash2(i, 2) * .3], [w * .56 + i * .1, .045, 1.9 - hash2(i, 5) * .3], '#9ac0c8'); discY(w * .72, .046, 1.5, .14, '#f4f0e8'); for (let i = 0; i < 4; i++) lw([w * .72, .047, 1.5], [w * .72 + Math.cos(i * 1.57 + .4) * .13, .047, 1.5 + Math.sin(i * 1.57 + .4) * .13], '#b8342e'); spx(w * .3, .046, 1.6, 0, 0, '#b8342e'); spx(w * .2, .046, 1.3, 0, 0, '#b8342e'); }
  else if (k === 'buoy') { discY(w / 2, .05, 1.6, .36, '#f4f0e8'); discY(w / 2, .055, 1.6, .2, p.bg || '#e9dcc0'); for (let i = 0; i < 4; i++) { const a = i * 1.5708 + .78; fq([[w / 2 + Math.cos(a - .25) * .2, .056, 1.6 + Math.sin(a - .25) * .2], [w / 2 + Math.cos(a - .25) * .36, .056, 1.6 + Math.sin(a - .25) * .36], [w / 2 + Math.cos(a + .25) * .36, .056, 1.6 + Math.sin(a + .25) * .36], [w / 2 + Math.cos(a + .25) * .2, .056, 1.6 + Math.sin(a + .25) * .2]], '#d63a3a'); } }
  else if (k === 'flags') { const n = Math.max(2, Math.round(w / .7)); for (let i = 0; i < n; i++) { const x = .25 + i * (w - .5) / Math.max(1, n - 1), cc = (p.cols || ['#b8342e', '#2f5f9f', '#e8c06a', '#3f8a55'])[i % 4]; tube([x, .1, .0], [x, .1, 2.45], '#d8a848'); spx(x, .1, 2.5, 0, 0, '#fff2c4'); fq([[x, .11, 2.4], [x + .34, .11, 2.3], [x + .3, .11, 1.5], [x, .11, 1.62]], cc, dk(cc, .12)); lw([x + .1, .11, 2.1], [x + .26, .11, 2.05], lt(cc, .5)); cyl(x, .12, 0, .1, .06, '#5a4a3a', { ol: false }); } }
  else if (k === 'awards') { table(0, 0, w, .3, 1.0, c, { th: .06 }); bx(0, .02, 1.5, w, .26, .05, c); for (let i = 0; i < Math.round(w * 2.4); i++) { const x = .12 + i * .4, z = i % 2 ? 1.55 : 1.0; if (x > w - .1) break; cyl(x, .15, z, .05, .04, '#3a3040', { ol: false }); post(x, .15, z + .04, z + .16, c2); hash2(i, 3) > .5 ? ball(x, .15, z + .22, .06, c2, { ol: false }) : fq([[x - .06, .16, z + .16], [x + .06, .16, z + .16], [x + .09, .16, z + .32], [x - .09, .16, z + .32]], c2); } }
  else if (k === 'mural') { const cols = p.cols || ['#2f5f9f', '#e8843a', '#f2c230', '#3f8a55', '#b8342e']; qy(0, w, .03, .4, 2.4, cols[0]); for (let i = 0; i < Math.round(w * 2.2); i++) { const x = hash2(i, 1, p.seed || 1) * (w - .5), z = .5 + hash2(i, 2, p.seed || 1) * 1.3, r = .15 + hash2(i, 3) * .35, cc = cols[1 + i % (cols.length - 1)]; i % 3 === 0 ? discY(x + .25, .035, z + .3, r, cc) : i % 3 === 1 ? fq([[x, .035, z], [x + r * 2, .035, z], [x + r, .035, Math.min(2.38, z + r * 2)]], cc) : qy(x, Math.min(w, x + r * 1.6), .035, z, Math.min(2.38, z + r * 1.2), cc); } frameY(0, w, .035, .4, 2.4, dk(cols[0], .5)); }
  else if (k === 'plane') { bx(0, 0, 1.1, w, .04, 1.0, '#3a3f4c'); qy(.06, w - .06, .04, 1.16, 2.04, '#8ac4e0', '#a8d8ec'); fq([[w * .2, .045, 1.5], [w * .75, .045, 1.62], [w * .82, .045, 1.7], [w * .75, .045, 1.74], [w * .22, .045, 1.64]], '#f4f0e8'); fq([[w * .42, .045, 1.56], [w * .62, .045, 1.3], [w * .68, .045, 1.32], [w * .56, .045, 1.6]], '#d8dade'); fq([[w * .2, .045, 1.6], [w * .14, .045, 1.86], [w * .2, .045, 1.86], [w * .3, .045, 1.64]], '#b8342e'); for (let i = 0; i < 3; i++) qy(.1 + hash2(i, 4) * (w - .7), .1 + hash2(i, 4) * (w - .7) + .4, .042, 1.25 + i * .28, 1.31 + i * .28, '#f4fbfc'); }
}
function sconce(p) {
  const k = p.kind || 'globe', b = mt(p), z = 1.75;
  bx(.14, 0, z - .1, .12, .05, .2, b); lw([.2, .05, z], [.2, .14, z + .06], b);
  if (k === 'fan') { lit(() => fq([[.2, .14, z], [.02, .14, z + .34], [.38, .14, z + .34]], '#fff2c4', '#ffe6a0')); for (const x of [.02, .11, .2, .29, .38]) lw([.2, .14, z], [x, .14, z + .34], b); }
  else if (k === 'tube') { lit(() => qy(.14, .26, .14, z - .2, z + .4, '#f4fbfc')); frameY(.14, .26, .14, z - .2, z + .4, b); }
  else lit(() => ball(.2, .14, z + .16, .09, '#fff2c4', { ol: false }));
  glow(() => { ball(.2, .14, z + .16, .15, '#ffe6a0', { ol: false }); });
}
function intercom(p) {
  const b = mt(p); qy(.05, .45, .04, .95, 1.6, b); frameY(.05, .45, .04, .95, 1.6, dk(b, .45)); qy(.12, .38, .045, 1.42, 1.54, '#2a2733'); for (let i = 0; i < 3; i++) lw([.14, .046, 1.45 + i * .03], [.36, .046, 1.45 + i * .03], '#6a7078');
  for (let r = 0; r < 5; r++) { const z = 1.0 + r * .08; qy(.1, .3, .045, z, z + .05, '#f4f0e8'); spx(.37, .045, z + .04, 0, 0, r === (p.seed || 2) % 5 ? '#5af08a' : '#3a3040'); }
}
function timeclock(p) {
  bx(.05, 0, 1.25, .4, .12, .5, '#5a6272'); lit(() => { qy(.1, .4, .12, 1.52, 1.68, '#1e2028'); textY('7:58', .13, .12, 1.67, '#5af08a'); }); qy(.14, .36, .12, 1.3, 1.36, '#2a2733');
  bx(.52, 0, 1.0, .46, .06, .9, '#8a5a3a'); for (let r = 0; r < 5; r++) for (let i = 0; i < 3; i++) { const z = 1.05 + r * .17, x = .55 + i * .14; qy(x, x + .11, .06, z, z + .13, hash2(i, r, 3) > .25 ? ['#f8f4ea', '#f2e6b0', '#f8f4ea'][i] : '#6a4a30'); lw([x, .06, z], [x + .11, .06, z], '#5a3a26'); }
}

/* ---------- floor pieces ---------- */
function desk(p) {
  const w = p.w || 2.5, st = p.style || 'wood', c = p.c || ({ marble: '#e8e4dc', wood: '#8a5a3a', deco: '#3a3440', steel: '#c4c9ce', concrete: '#9a9a96', glass: '#f1ede4', green: '#2f5a4a' })[st] || '#8a5a3a', a = p.a || K.brass, top = p.top || (st === 'marble' || st === 'deco' ? '#2a2733' : st === 'concrete' ? '#6a4a30' : lt(c, .3));
  table(.1, 0, w - .2, .45, .75, dk(top, .1), { leg: '#5a6272' }); monitor(w * .32, .08, .75, .44, .3, { scr: p.scr || '#3a6ea5', seed: p.seed || 2 }); bx(w * .6, .14, .75, .2, .2, .08, '#2a2733');
  const front = st === 'marble' ? (u, v) => { const t = hash2((u + v * 2) >> 3, (u - v) >> 3, 5); return t > .9 || (u * 2 + v * 3) % 29 === 0 ? dk(c, .2) : c; } : st === 'concrete' ? (u, v) => v % 6 === 0 ? dk(c, .16) : hash2(u >> 1, v >> 1, 2) > .9 ? dk(c, .1) : c : null;
  box(0, .45, 0, w, .35, 1.05, c, front ? { l: front } : null);
  if (st === 'deco') { for (let i = 0; i < 3; i++) frameY(.1 + i * .1, w - .1 - i * .1, .8, .1 + i * .1, .95 - i * .1, a); fq(arcY(w / 2, .8, .2, .32, 0, Math.PI, 8), a); }
  else if (st === 'glass') { lit(() => qy(.08, w - .08, .8, .12, .3, a)); glow(() => qy(.05, w - .05, .8, .08, .34, lt(a, .4))); qy(0, w, .8, .9, 1.05, '#bfe4ee', '#cfeef4'); }
  else if (st === 'wood' || st === 'green') { const n = Math.round(w / .6); for (let i = 0; i < n; i++) frameY(i * w / n + .08, (i + 1) * w / n - .08, .8, .15, .85, dk(c, .35)); lw([0, .8, .95], [w, .8, .95], a); }
  else if (st === 'steel') { for (let z = .2; z < 1; z += .2) lw([0, .8, z], [w, .8, z], dk(c, .25)); qy(0, w, .8, .0, .1, '#2a2733'); }
  qy(0, w, .8, 0, .08, dk(c, .5));
  if (p.name) signY(p.name, w / 2 - Math.min(w / 2 - .15, 1.1), w / 2 + Math.min(w / 2 - .15, 1.1), .8, .46, .72, st === 'glass' ? '#f8f4ea' : dk(c, .25), st === 'glass' ? dk(a, .3) : a, { frame: false });
  box(-.04, .42, 1.05, w + .08, .42, .06, top);
  if (p.lamp !== false) lamp(.3, .62, 1.11, .42, p.shade || '#3f8a55', { r: .1, base: a }); if (p.flowers !== false) plant(w - .32, .62, 1.11, .5, { flower: p.flower || '#e87aa0', pot: a }); cyl(w * .55, .64, 1.11, .05, .05, a, { ol: false }); spx(w * .55, .64, 1.2, 0, 0, lt(a, .5));
}
function podium(p) {
  const c = p.c || '#3a3f4c', a = p.a || '#d8a848';
  box(0, .15, 0, 1, .45, 1.1, c); qy(0, 1, .6, .0, .08, dk(c, .5)); qy(.1, .9, .6, .5, .78, a); signY(p.name || 'SECURITY', .1, .9, .6, .52, .76, a, c, { frame: false });
  box(-.03, .12, 1.1, 1.06, .5, .05, lt(c, .2)); bx(.08, .16, 1.15, .84, .1, .3, '#1e2028'); lit(() => { for (let i = 0; i < 3; i++) qy(.11 + i * .27, .35 + i * .27, .26, 1.19, 1.41, ['#3a5a4a', '#4a5a6a', '#3a4a5a'][i], '#5a6a7a'); });
}
function turnstile(p) {
  const n = p.n || 2, c = p.c || '#c4c9ce', lane = .8, w = n * lane + .25;
  for (let i = 0; i <= n; i++) { const x = i * lane; box(x, 0, 0, .25, .5, .95, c, { t: lt(c, .3) }); qy(x + .04, x + .21, .5, .55, .8, '#2a2733'); lit(() => { spx(x + .12, .5, .7, 0, 0, i % 2 ? '#5af08a' : '#ff5a4a'); spx(x + .12, .5, .7, 1, 0, i % 2 ? '#5af08a' : '#ff5a4a'); }); qz(x + .04, x + .21, .1, .3, .96, '#2a2733'); }
  for (let i = 0; i < n; i++) { const x = i * lane + .25; qy(x + .02, x + lane / 2 - .14, .25, .2, .85, '#bfe4ee', '#cfeef4'); qy(x + lane / 2 - .11, x + lane - .27, .25, .2, .85, '#bfe4ee', '#cfeef4'); frameY(x + .02, x + lane / 2 - .14, .25, .2, .85, '#8ab4c4'); frameY(x + lane / 2 - .11, x + lane - .27, .25, .2, .85, '#8ab4c4'); }
}
function rail(p) {
  const w = p.w || 2, c = p.c || '#8a9098';
  if (p.kind === 'rope') { for (let x = .1; x <= w; x += Math.max(.9, (w - .2) / Math.max(1, Math.round((w - .2) / 1.2)))) { cyl(x, .1, 0, .08, .03, K.brass, { ol: false }); tube([x, .1, .03], [x, .1, .85], K.brass); ball(x, .1, .88, .04, K.brass, { ol: false }); } for (let x = .1; x < w - .3; x += .1) spx(x, .1, .78 - Math.sin(((x - .1) % 1.2) / 1.2 * Math.PI) * .12, 0, 0, p.rc || '#b8342e'); return; }
  qy(0, w, .1, .08, .9, '#bfe4ee', '#cfeef4'); for (let x = 0; x <= w + .001; x += w / Math.max(1, Math.round(w))) post(Math.min(x, w), .1, 0, .95, c); tube([0, .1, .95], [w, .1, .95], c); lw([0, .1, .08], [w, .1, .08], c);
}
function packages(p) {
  const w = p.w || 1.5, c = p.c || '#8a6a4a';
  for (const z of [.05, .6, 1.15]) bx(0, 0, z, w, .5, .05, c); for (const x of [0, w - .05]) for (const y of [0, .45]) bx(x, y, 0, .05, .05, 1.65, dk(c, .2));
  let k = 0; for (const z of [.1, .65, 1.2]) for (let x = .08; x < w - .3; k++) { const h = hash2(k, p.seed || 1, 2), ww = .26 + h * .3, hh = .16 + hash2(k, 7) * .26; if (x + ww > w - .06) break; if (h > .82) { bx(x, .1, z, ww, .3, .07, '#f4f0e8'); lw([x + .04, .4, z + .04], [x + ww - .04, .4, z + .04], '#b8342e'); } else carton(x, .08, z, ww, .34, hh, [K.card, '#d8b07a', '#b88a52', '#e8d8b8'][k % 4]); x += ww + .06; }
}
function coffeebar(p) {
  const c = p.c || '#3a3f4c', a = p.a || '#d8a848', w = 2.4;
  box(0, .35, 0, w, .5, 1.0, c); qy(0, w, .85, 0, .08, dk(c, .5)); for (let i = 0; i < 4; i++) frameY(i * .6 + .06, i * .6 + .54, .85, .14, .82, dk(c, .3)); box(-.04, .3, 1.0, w + .08, .6, .06, p.top || '#c89a62');
  box(.15, .4, 1.06, .5, .34, .42, '#b8bcc0'); qy(.2, .6, .74, 1.12, 1.3, '#2a2733'); lit(() => { spx(.26, .74, 1.4, 0, 0, '#5af08a'); spx(.32, .74, 1.4, 0, 0, '#ff8a40'); }); cyl(.3, .78, 1.06, .04, .08, '#f4f0e8', { ol: false }); cyl(.48, .78, 1.06, .04, .08, '#f4f0e8', { ol: false });
  box(1.0, .5, 1.06, .5, .28, .04, '#f4f0e8', { ol: false }); for (let i = 0; i < 4; i++) ball(1.08 + i * .11, .62, 1.14, .05, ['#c8904a', '#e8b86a', '#8a5a3a', '#e87aa0'][i], { ol: false }); qy(.98, 1.52, .8, 1.06, 1.34, '#bfe4ee', 'glass');
  for (let i = 0; i < 3; i++) cyl(1.8 + i * .14, .6, 1.06, .045, .13, ['#f4f0e8', '#c0563a', '#f4f0e8'][i], { ol: false, t: '#6a4a30' }); box(2.05, .42, 1.06, .26, .26, .2, '#4a4f5c');
  for (const x of [.02, w - .06]) bx(x, .36, 1.06, .04, .04, 1.0, a); bx(0, .34, 2.0, w, .08, .3, c); lit(() => signY(p.name || 'COFFEE', .1, w - .1, .42, 2.04, 2.26, c, a, { frame: false })); glow(() => qy(.1, w - .1, .43, 1.96, 2.0, '#ffe6a0'));
}
function column(p) {
  const k = p.kind || 'marble', h = p.h || 2.8, c = p.c || ({ marble: '#e8e4dc', deco: '#3a3440', concrete: '#9a9a96', brick: '#a8553f', steel: '#5a6272', wood: '#7a4e2d' })[k];
  if (k === 'steel') { box(.14, .14, 0, .22, .22, h, c); bx(.06, .06, 0, .38, .38, .06, dk(c, .2)); for (let z = .3; z < h; z += .5) { spx(.36, .25, z, 0, 0, lt(c, .4)); spx(.2, .36, z, 0, 0, lt(c, .4)); } return; }
  if (k === 'marble') { box(.02, .02, 0, .46, .46, .22, dk(c, .1)); cyl(.25, .25, .22, .17, h - .5, c); for (const dx of [-3, 0, 3]) for (let z = .3; z < h - .34; z += .06) spx(.25, .25, z, dx, 4, dk(c, .16)); box(0, 0, h - .28, .5, .5, .28, lt(c, .1)); return; }
  const pat = k === 'brick' ? PAT.brick(c) : k === 'concrete' ? (u, v) => v % 10 === 0 ? dk(c, .2) : hash2(u >> 1, v >> 1, 3) > .92 ? dk(c, .1) : c : null;
  box(.05, .05, 0, .4, .4, h, c, pat ? { l: pat, r: (u, v) => dk(pat(u, v), .16) } : null);
  if (k === 'deco') { const b = p.a || K.brass; for (const z of [.12, .2, h - .3, h - .22]) { lw([.05, .45, z], [.45, .45, z], b); lw([.45, .05, z], [.45, .45, z], b); } lw([.25, .45, .2], [.25, .45, h - .3], b); box(0, 0, h - .14, .5, .5, .14, b); }
  if (k === 'wood') { box(0, 0, 0, .5, .5, .3, dk(c, .15)); box(0, 0, h - .2, .5, .5, .2, dk(c, .15)); }
}
function bike(p) {
  const c = p.c || '#c0392b', wh = (x) => { for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283, b = (i + 1) / 12 * 6.283; lw([x + Math.cos(a) * .3, .2, .32 + Math.sin(a) * .3], [x + Math.cos(b) * .3, .2, .32 + Math.sin(b) * .3], '#2a2733'); } spx(x, .2, .32, 0, 0, '#b8bcc0'); };
  wh(.35); wh(1.15); tube([.35, .2, .32], [.62, .2, .72], c); tube([.62, .2, .72], [1.02, .2, .76], c); tube([.62, .2, .72], [.72, .2, .32], c); tube([.72, .2, .32], [1.02, .2, .76], c); tube([1.15, .2, .32], [1.04, .2, .9], '#8a9098'); lw([.96, .2, .92], [1.12, .2, .9], '#2a2733'); bx(.54, .16, .78, .16, .08, .04, '#2a2733'); lw([.72, .2, .32], [.35, .2, .32], c);
  if (p.basket) box(1.08, .08, .62, .22, .24, .16, '#c89a62');
}
function umbrella(p) {
  cyl(.2, .2, 0, .14, .45, p.c || '#5a6272', { t: '#2a2733' }); for (const [dx, dy, c] of [[-.05, 0, '#b8342e'], [.05, .03, '#2f5f9f'], [0, -.05, '#2a2733']]) { tube([.2 + dx, .2 + dy, .3], [.2 + dx * 2.4, .2 + dy * 2.4, .86], c); spx(.2 + dx * 2.4, .2 + dy * 2.4, .9, 0, 0, '#8a5a3a'); spx(.2 + dx * 2.4, .2 + dy * 2.4, .9, 1, 0, '#8a5a3a'); }
}
function settee(p) {
  const w = p.w || 2, c = p.c || '#7a2f3a', b = p.a || K.brass;
  bx(0, 0, .12, w, .2, .9, c); for (let i = 0; i < Math.round(w / .5); i++) fq(arcY(.25 + i * .5, .2, 1.0, .25, 0, Math.PI, 6), lt(c, .08)); box(0, 0, .12, w, .85, .3, c); bx(.08, .2, .42, w - .16, .64, .1, lt(c, .14));
  for (let x = .3; x < w; x += .5) spx(x, .2, .8, 0, 0, b); for (const x of [0, w - .14]) bx(x, 0, .12, .14, .85, .46, dk(c, .08)); for (const [x, y] of [[.05, .82], [w - .05, .82], [w - .05, .05]]) post(x, y, 0, .12, b);
}
function chandelier(p) {
  const k = p.kind || 'crystal', b = mt(p), z = p.z || 2.2;
  post(.5, .5, z + .3, 3, '#2a2733');
  if (k === 'ring') { for (let i = 0; i < 20; i++) { const a = i / 20 * 6.283, a2 = (i + 1) / 20 * 6.283; tube([.5 + Math.cos(a) * .48, .5 + Math.sin(a) * .48, z], [.5 + Math.cos(a2) * .48, .5 + Math.sin(a2) * .48, z], b); } lit(() => { for (let i = 0; i < 20; i++) spx(.5 + Math.cos(i / 20 * 6.283) * .48, .5 + Math.sin(i / 20 * 6.283) * .48, z - .03, 0, 0, '#fff2c4'); }); for (const a of [0, 2.1, 4.2]) lw([.5, .5, z + .3], [.5 + Math.cos(a) * .48, .5 + Math.sin(a) * .48, z], '#2a2733'); }
  else if (k === 'industrial') { cyl(.5, .5, z + .02, .34, .22, p.c || '#3f5a4a', { t: dk(p.c || '#3f5a4a', .2) }); lit(() => cyl(.5, .5, z, .26, .02, '#fff2c4', { ol: false })); }
  else if (k === 'deco') { for (let i = 0; i < 3; i++) { cyl(.5, .5, z + i * .12, .42 - i * .12, .1, i % 2 ? b : '#f4ead0', { ol: false, t: b }); } lit(() => cyl(.5, .5, z - .03, .3, .03, '#fff2c4', { ol: false })); }
  else { cyl(.5, .5, z + .22, .1, .08, b, { ol: false }); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283, x = .5 + Math.cos(a) * .4, y = .5 + Math.sin(a) * .4; lw([.5, .5, z + .24], [x, y, z + .12], b); lit(() => { spx(x, y, z + .16, 0, 0, '#fff2c4'); spx(x, y, z + .16, 0, -1, '#ffe680'); }); for (let j = 0; j < 3; j++) spx(x, y, z + .06 - j * .07, 0, 0, j % 2 ? '#d8f0f8' : '#f4fbfc'); } for (let j = 0; j < 5; j++) spx(.5, .5, z + .1 - j * .07, j % 2, 0, '#eefafc'); }
  glow(() => { ball(.5, .5, z + .05, .4, '#ffe6a0', { ol: false }); });
}
function inlay(p) {
  const w = p.w || 3, d = p.d || 3, k = p.kind || 'star', c = p.c || '#2a2733', c2 = p.c2 || '#e8e4dc', c3 = p.c3 || K.brass, z = .012, cx = w / 2, cy = d / 2, r = Math.min(w, d) / 2;
  if (k === 'star' || k === 'compass') { const n = k === 'compass' ? 8 : 12; const ring = (rr, col) => { const pts = []; for (let i = 0; i < 24; i++) pts.push([cx + Math.cos(i / 24 * 6.283) * rr, cy + Math.sin(i / 24 * 6.283) * rr, z]); fq(pts, col); }; ring(r, c3); ring(r - .08, c2); ring(r * .78, c3); ring(r * .78 - .06, c);
    for (let i = 0; i < n; i++) { const a = i / n * 6.283, q = k === 'compass' && i % 2 ? r * .45 : r * .74, h = 3.1416 / n; fq([[cx, cy, z], [cx + Math.cos(a - h) * q * .3, cy + Math.sin(a - h) * q * .3, z], [cx + Math.cos(a) * q, cy + Math.sin(a) * q, z]], c2); fq([[cx, cy, z], [cx + Math.cos(a + h) * q * .3, cy + Math.sin(a + h) * q * .3, z], [cx + Math.cos(a) * q, cy + Math.sin(a) * q, z]], c3); } ring(r * .1, c3); }
  else if (k === 'checker') { const s = p.s || .5; qz(0, w, 0, d, z, (x, y) => (Math.floor(x / s + 100) + Math.floor(y / s + 100)) & 1 ? c : c2); frameZ(0, w, 0, d, z, c3); }
  else if (k === 'border') { qz(0, w, 0, d, z, c3); qz(.1, w - .1, .1, d - .1, z, c); qz(.3, w - .3, .3, d - .3, z, c3); qz(.36, w - .36, .36, d - .36, z, c2); }
  else if (k === 'terrazzo') { qz(0, w, 0, d, z, (x, y) => { const h = hash2(Math.floor(x * 9 + 500), Math.floor(y * 9 + 500), p.seed || 1); return h > .93 ? c : h > .86 ? c3 : h < .05 ? lt(c2, .3) : c2; }); frameZ(0, w, 0, d, z, dk(c2, .3)); }
  else if (k === 'herring') { qz(0, w, 0, d, z, (x, y) => { const u = Math.floor(x * 8 + 800), v = Math.floor(y * 8 + 800), q = (u + v) % 8 < 4; return (q ? u - v : u + v) % 4 === 0 ? dk(c, .25) : q ? c : c2; }); frameZ(0, w, 0, d, z, dk(c, .4)); }
  else if (k === 'stripe') { qz(0, w, 0, d, z, c); const al = w >= d; for (const o of [.12, .22]) { al ? (qz(0, w, o, o + .05, z, c2), qz(0, w, d - o - .05, d - o, z, c2)) : (qz(o, o + .05, 0, d, z, c2), qz(w - o - .05, w - o, 0, d, z, c2)); } frameZ(0, w, 0, d, z, dk(c, .35)); }
  else if (k === 'diamond') { qz(0, w, 0, d, z, c2); const s = p.s || 1; for (let i = 0; i * s < w + d; i++) for (let j = -Math.ceil(d / s); j * s < w; j++) { const x = (i + j) * s / 2 + s / 2, y = (i - j) * s / 2; if (x < s * .3 || y < s * .3 || x > w - s * .3 || y > d - s * .3) continue; fq([[x - s * .22, y, z], [x, y - s * .22, z], [x + s * .22, y, z], [x, y + s * .22, z]], (i + j) & 1 ? c : c3); } frameZ(0, w, 0, d, z, c3); }
}

export default [
  F('lobby.mailboxes', ['lobby', 'lobby_mail'], p => [p.w || 2, .15, 1.9], mailboxes, W({ use: p => ({ x: (p.w || 2) / 2, y: .6 }), variants: [{}, { w: 3, m: 'steel', rows: 4 }, { w: 1.5, m: 'bronze', rows: 2, z0: .95 }, { w: 2.5, m: 'copper', rows: 3 }] })),
  F('lobby.lift', ['lobby', 'lobby_lift'], [1.6, .2, 2.6], lift, W({ use: { x: .8, y: .6 }, variants: [{ style: 'steel' }, { style: 'deco', floor: 5 }, { style: 'cage' }, { style: 'glass' }, { style: 'freight' }, { style: 'deco', m: 'copper', c: '#2f4a3f', floor: 9 }] })),
  F('lobby.stairs', ['lobby', 'lobby_stairs'], [1.2, .1, 2.3], stairs, W({ use: { x: .6, y: .6 }, variants: [{}, { open: true }, { open: true, arch: true, c: '#a8553f' }, { dc: '#a85a4a', c: '#5a4a3a' }] })),
  F('lobby.restroom', ['toilet', 'lobby_restroom'], [1, .1, 2.2], restroom, W({ use: { x: .5, y: .6 }, variants: [{}, { dc: '#8a5a3a', c: '#5a4030' }] })),
  F('lobby.board', ['lobby', 'lobby_board'], p => [p.w || 1.5, .1, 2.1], board, W({ use: p => ({ x: (p.w || 1.5) / 2, y: .6 }), variants: [{ kind: 'cork' }, { kind: 'felt', w: 2 }, { kind: 'digital', w: 2 }, { kind: 'safety', w: 2 }, { kind: 'cork', w: 2.5, seed: 7 }] })),
  F('lobby.panel', ['lobby', 'decor'], p => [p.w || 2, .15, 2.6], panel, W({ variants: [{ kind: 'wood', w: 3 }, { kind: 'sunburst', w: 3, c: '#2f4a3f' }, { kind: 'relief', w: 3, c: '#9a9a96', c2: '#e8843a' }, { kind: 'marble', w: 3, c: '#e8e4dc' }, { kind: 'logo', w: 3, c: '#2e3440', c2: '#e8c06a', name: 'MAPLE BAY' }, { kind: 'screens', w: 3 }, { kind: 'onair', w: 1.5 }, { kind: 'chart', w: 2 }, { kind: 'buoy', w: 1 }, { kind: 'flags', w: 3 }, { kind: 'awards', w: 2 }, { kind: 'mural', w: 4 }, { kind: 'plane', w: 2 }] })),
  F('lobby.sconce', ['lobby', 'lamp', 'decor'], [.4, .2, 2.2], sconce, W({ light: { x: .2, y: .3, z: 0, r: 2 }, variants: [{}, { kind: 'fan' }, { kind: 'tube', m: 'steel' }] })),
  F('lobby.intercom', ['lobby', 'lobby_buzzer'], [.5, .1, 1.7], intercom, W({ use: { x: .25, y: .6 }, variants: [{}, { m: 'steel' }] })),
  F('lobby.timeclock', ['lobby', 'decor'], [1, .15, 2], timeclock, W({})),
  F('lobby.desk', ['lobby', 'lobby_desk'], p => [p.w || 2.5, .8, 1.15], desk, { vb: p => [-.3, -.3, 0, (p.w || 2.5) + .3, 1.1, 1.8], use: p => ({ x: (p.w || 2.5) / 2, y: 1.3 }), staff: p => ({ x: (p.w || 2.5) / 2, y: -.3, dir: 1 }), variants: [{ style: 'wood', name: 'CONCIERGE' }, { style: 'marble', w: 3, name: 'RECEPTION' }, { style: 'deco', name: 'HARBOR TRUST' }, { style: 'glass', w: 3.5, a: '#3aa0c8', name: 'WELCOME' }, { style: 'concrete', w: 3, name: 'KESSLER' }, { style: 'steel', name: 'FRONT DESK' }, { style: 'green', name: 'PORTER' }] }),
  F('lobby.podium', ['lobby', 'lobby_desk'], [1, .6, 1.2], podium, { vb: [-.3, -.3, 0, 1.3, .9, 1.6], use: { x: .5, y: 1.1 }, staff: { x: .5, y: -.25, dir: 1 }, variants: [{}, { c: '#5a4030', a: '#e8c06a', name: 'DOORMAN' }] }),
  F('lobby.turnstile', ['lobby', 'lobby_gate'], p => [(p.n || 2) * .8 + .25, .5, 1], turnstile, { use: p => ({ x: ((p.n || 2) * .8 + .25) / 2, y: 1 }), variants: [{ n: 2 }, { n: 3 }, { n: 4, c: '#3a3f4c' }] }),
  F('lobby.rail', ['lobby', 'decor'], p => [p.w || 2, .2, 1], rail, { variants: [{ w: 2 }, { w: 3, kind: 'rope' }, { w: 4, c: '#d8a848' }] }),
  F('lobby.packages', ['lobby', 'lobby_packages'], p => [p.w || 1.5, .5, 1.7], packages, { use: p => ({ x: (p.w || 1.5) / 2, y: 1 }), variants: [{}, { w: 2, seed: 4, c: '#7d858e' }, { w: 1, seed: 9 }] }),
  F('lobby.coffeebar', ['lobby', 'lobby_coffee'], [2.4, .9, 2.35], coffeebar, { vb: [-.3, -.3, 0, 2.7, 1.2, 2.5], use: { x: 1.2, y: 1.4 }, staff: { x: 1.2, y: -.05, dir: 1 }, variants: [{}, { c: '#2f5a4a', a: '#f4e9cf', name: 'BEAN BAR' }, { c: '#8a4a34', a: '#f2c230', name: 'ESPRESSO' }] }),
  F('lobby.column', ['lobby', 'decor', 'column'], p => [.5, .5, p.h || 2.8], column, { variants: [{ kind: 'marble' }, { kind: 'deco' }, { kind: 'concrete' }, { kind: 'brick' }, { kind: 'steel' }, { kind: 'wood' }, { kind: 'marble', c: '#3f6a5a' }] }),
  F('lobby.bike', ['lobby', 'decor'], [1.5, .4, 1], bike, { variants: [{}, { c: '#2f8f8a', basket: true }, { c: '#f2c230' }] }),
  F('lobby.umbrella', ['lobby', 'decor'], [.4, .4, .9], umbrella, { variants: [{}, { c: '#d8a848' }] }),
  F('lobby.settee', ['lobby', 'seating', 'sofa'], p => [p.w || 2, .9, 1.25], settee, { seats: p => Array.from({ length: Math.round(p.w || 2) }, (_, i) => ({ x: .55 + i * (((p.w || 2) - 1.1) / Math.max(1, Math.round(p.w || 2) - 1)), y: .55, z: .42, dir: 1 })), variants: [{}, { c: '#2f5a4a', w: 3 }, { c: '#2f3f72', a: '#c4c9ce' }] }),
  F('lobby.chandelier', ['lobby', 'lamp', 'overhead', 'decor'], [1, 1, 3], chandelier, { solid: false, overhead: true, vb: [-.2, -.2, 1.7, 1.2, 1.2, 3.1], light: { x: .5, y: .5, z: 0, r: 4 }, variants: [{}, { kind: 'deco' }, { kind: 'ring', m: 'black' }, { kind: 'industrial' }, { kind: 'ring', m: 'brass' }] }),
  F('lobby.inlay', ['lobby', 'rug', 'decor'], p => [p.w || 3, p.d || 3, .02], inlay, { solid: false, flat: true, variants: [{ kind: 'star' }, { kind: 'compass', c: '#2f3f72', c3: '#b8342e' }, { kind: 'checker', w: 4, d: 3 }, { kind: 'border', w: 4, d: 2.5, c: '#7a2f3a', c2: '#e8dcc0' }, { kind: 'terrazzo', w: 4, d: 3, c: '#c0563a', c3: '#3f8a6a', c2: '#e8e4dc' }, { kind: 'herring', w: 4, d: 3, c: '#b07444', c2: '#c89a62' }, { kind: 'stripe', w: 5, d: 1.2, c: '#7a2f3a', c2: '#e8c06a' }, { kind: 'diamond', w: 4, d: 3, c: '#2a2733', c2: '#e8e4dc' }] }),
];
