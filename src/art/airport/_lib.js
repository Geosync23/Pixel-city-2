// Shared helpers for the airport art set (local to this folder).
import { U, ENV, C, PW, px, fq, lw, qy, qx, qz, box, lit, glow, dk, lt, mix, isFlipped, spx, winY, winX } from '../../engine/raster.js';

export const SNOW = '#f4f8fb';
export const winter = () => ENV.season === 3;
/** airport house palette */
export const AP = {
  wall: '#e9e6dc', wall2: '#d6d9dc', steel: '#9aa7b4', dark: '#3d4654', ink: '#27303c', roof: '#c9d2d8',
  glassA: '#6fb4cf', glassB: '#93cce0', glassD: '#4f93b3', red: '#d8483a', navy: '#27456b', teal: '#2f8f8a',
  yel: '#f2c230', orange: '#f08a2c', conc: '#b9b6ab', tyre: '#2b2a35', warm: '#ffd98a', sky: '#3f7fc4',
};

/* ---------- text (own copy of the 3x5 font so we can scale it) ---------- */
const FONT = {
  A: '25755', B: '65656', C: '34443', D: '65556', E: '74647', F: '74644', G: '34553', H: '55755', I: '72227', J: '11152', K: '55655', L: '44447', M: '57555', N: '65555', O: '25552', P: '65644', Q: '25563', R: '65655', S: '34216', T: '72222', U: '55557', V: '55552', W: '55575', X: '55255', Y: '55222', Z: '71247',
  0: '75557', 1: '26227', 2: '61247', 3: '61216', 4: '55711', 5: '74616', 6: '34757', 7: '71222', 8: '75757', 9: '75716',
  ' ': '00000', '.': '00002', ',': '00024', '!': '22202', '?': '61202', '-': '00700', '+': '02720', ':': '02020', "'": '22000', '/': '11244', '&': '25256', '>': '42124', '<': '12421', '=': '07070', '^': '02500', '_': '00007',
};
export const tw = (s, k = 1) => (String(s).length * 4 - 1) * k;
/**
 * Scaled wall text. face 'y': on a +y wall, top-left at (x,y,z) reading along +x.
 * face 'x': on a +x wall, top-left at (x, yHigh, z) reading toward -y. k = integer pixel scale. Flip-safe.
 */
export function wtext(face, str, x, y, z, hex, k = 1) {
  str = String(str).toUpperCase(); const W = tw(str, k), c = C(hex), fl = isFlipped();
  let s, sl;
  if (face === 'y') { s = fl ? PW(x + W / U, y, z) : PW(x, y, z); sl = fl ? -1 : 1; }
  else { s = fl ? PW(x, y - W / U, z) : PW(x, y, z); sl = fl ? 1 : -1; }
  const X = Math.round(s[0]), Y = Math.round(s[1]);
  for (let i = 0; i < str.length; i++) {
    const g = FONT[str[i]] || FONT['?'];
    for (let r = 0; r < 5; r++) { const bits = +g[r]; for (let b = 0; b < 3; b++) if (bits & (4 >> b)) for (let a = 0; a < k; a++) for (let e = 0; e < k; e++) { const u = (i * 4 + b) * k + a; px(X + u, Y + sl * (u >> 1) + r * k + e, c); } }
  }
}
/** board with centred (scaled) text on a +y wall */
export function bsignY(str, x0, x1, y, z0, z1, bg, fg, o) {
  o = o || {}; const k = o.k || 1;
  const d = () => { if (bg) qy(x0, x1, y, z0, z1, bg); wtext('y', str, x0 + ((x1 - x0) - tw(str, k) / U) / 2, y, z1 - ((z1 - z0) - 5 * k / U) / 2, fg, k); };
  if (o.lit) lit(d); else d();
  if (bg && o.frame !== false) { const f = dk(bg, .5); lw([x0, y, z0], [x1, y, z0], f); lw([x0, y, z1], [x1, y, z1], f); lw([x0, y, z0], [x0, y, z1], f); lw([x1, y, z0], [x1, y, z1], f); }
}
/** board with centred (scaled) text on a +x wall spanning y0..y1 */
export function bsignX(str, x, y0, y1, z0, z1, bg, fg, o) {
  o = o || {}; const k = o.k || 1;
  const d = () => { if (bg) qx(x, y0, y1, z0, z1, bg); wtext('x', str, x, y1 - ((y1 - y0) - tw(str, k) / U) / 2, z1 - ((z1 - z0) - 5 * k / U) / 2, fg, k); };
  if (o.lit) lit(d); else d();
  if (bg && o.frame !== false) { const f = dk(bg, .5); lw([x, y0, z0], [x, y1, z0], f); lw([x, y0, z1], [x, y1, z1], f); lw([x, y0, z0], [x, y0, z1], f); lw([x, y1, z0], [x, y1, z1], f); }
}

/* ---------- small shapes ---------- */
const ring = (n, f) => { const a = []; for (let i = 0; i < n; i++) a.push(f(i / n * Math.PI * 2)); return a; };
/** disc on a constant-y plane (wheels, tail rotors) */
export const discY = (x, y, z, r, h, h2, n = 12) => fq(ring(n, a => [x + r * Math.cos(a), y, z + r * Math.sin(a)]), h, h2);
/** disc on a constant-x plane (engine intakes, propellers) */
export const discX = (x, y, z, r, h, h2, n = 12) => fq(ring(n, a => [x, y + r * Math.cos(a), z + r * Math.sin(a)]), h, h2);
/** horizontal disc */
export const discZ = (x, y, z, r, h, h2, n = 20) => fq(ring(n, a => [x + r * Math.cos(a), y + r * Math.sin(a), z]), h, h2);
/** wheel seen on the +y side, resting on z (centre at z+r) */
export function wheel(x, y, z, r, hub) {
  discY(x, y - .12, z + r, r, '#1d1c26'); discY(x, y, z + r, r, AP.tyre); discY(x, y, z + r, r * .5, hub || '#aab0b8', null, 8);
}
/** small lamp: bright core (always lit) + night halo */
export function lamp(x, y, z, hex, big) {
  const h2 = mix(hex, '#141a33', .45);
  glow(() => { for (const [a, b] of big ? [[-2, 0], [3, 0], [-2, -1], [3, -1], [0, -3], [1, -3], [0, 2], [1, 2], [-1, 1], [2, 1], [-1, -2], [2, -2]] : [[-1, 0], [2, 0], [-1, -1], [2, -1], [0, -2], [1, -2], [0, 1], [1, 1]]) spx(x, y, z, a, b, h2);
    if (big) for (const [a, b] of [[-1, 0], [2, 0], [-1, -1], [2, -1], [0, -2], [1, -2], [0, 1], [1, 1]]) spx(x, y, z, a, b, hex); });
  lit(() => { spx(x, y, z, 0, 0, hex); spx(x, y, z, 1, 0, hex); spx(x, y, z, 0, -1, hex); spx(x, y, z, 1, -1, hex); });
}
/** single lit pixel */
export const dot = (x, y, z, hex) => lit(() => spx(x, y, z, 0, 0, hex));
/** snow sheet on a flat roof (winter only) */
export function snowTop(x0, x1, y0, y1, z, m = .25) { if (!winter()) return; qz(x0, x1, y0, y1, z, SNOW, 'glass'); qz(x0 + m, x1 - m, y0 + m, y1 - m, z, SNOW); qz(x0 + m * 2, x1 - m * 3, y0 + m * 2, y1 - m * 3, z, SNOW, '#e3ecf3'); }

/* ---------- lofted surfaces ---------- */
/** quantised face shading from a (camera-facing) normal: top = base, +y = dk .18, +x = dk .36, underside darker */
export function shade(base, n) {
  const l = Math.hypot(n[0], n[1], n[2]) || 1, x = n[0] / l, y = n[1] / l, z = n[2] / l;
  let a = x * x * (x > 0 ? .36 : .3) + y * y * (y > 0 ? .18 : .28) + z * z * (z > 0 ? 0 : .5);
  a = Math.round(a / .06) * .06; return a < .03 ? base : dk(base, a);
}
/**
 * Skin between consecutive sections (arrays of world points, same length), sections ordered by ascending x,
 * points ordered from the +y side up over the top toward -y. Back faces are culled.
 * o: { col: hex | (k,i)=>hex, closed, cap: hex (fills the last section), ol: hex|false, flat:true (no shading), h2:(k,i)=>dither }
 */
export function loft(secs, o) {
  o = o || {}; const M = secs[0].length, nk = o.closed ? M : M - 1, vis = [], cf = typeof o.col === 'function' ? o.col : () => o.col;
  let base0 = null;
  for (let i = 0; i < secs.length - 1; i++) {
    vis.push([]);
    for (let k = 0; k < nk; k++) {
      const A = secs[i][k], B = secs[i + 1][k], Cc = secs[i + 1][(k + 1) % M], D = secs[i][(k + 1) % M];
      const p = [D[0] - B[0], D[1] - B[1], D[2] - B[2]], q = [Cc[0] - A[0], Cc[1] - A[1], Cc[2] - A[2]];
      const n = [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
      const v = n[0] + n[1] + n[2] > 1e-9; vis[i].push(v); if (!v) continue;
      const b = cf(k, i); if (!b) { vis[i][k] = false; continue; } base0 = base0 || b;
      if (!o.nofill) fq([A, B, Cc, D], o.flat ? b : shade(b, n), o.h2 ? o.h2(k, i) : undefined);
    }
  }
  const last = secs[secs.length - 1];
  if (o.cap) fq(last, o.cap);
  if (o.ol === false || !base0) return;
  const oc = typeof o.ol === 'string' ? o.ol : dk(base0, .7);
  for (let i = 0; i < secs.length - 1; i++) for (let k = 0; k < nk; k++) {
    if (!vis[i][k]) continue;
    const kp = (k + 1) % M, prev = o.closed ? vis[i][(k + nk - 1) % nk] : (k > 0 && vis[i][k - 1]), next = o.closed ? vis[i][(k + 1) % nk] : (k < nk - 1 && vis[i][k + 1]);
    if (!prev) lw(secs[i][k], secs[i + 1][k], oc);
    if (!next) lw(secs[i][kp], secs[i + 1][kp], oc);
    if (i === 0 || !vis[i - 1][k]) lw(secs[i][k], secs[i][kp], oc);
    if (i === secs.length - 2 || !vis[i + 1][k]) lw(secs[i + 1][k], secs[i + 1][kp], oc);
  }
  if (o.cap) for (let k = 0; k < M; k++) lw(last[k], last[(k + 1) % M], oc);
}
/** sections for a tube along x. st: [{x,y,z,ry,rz}] (any order); map(x,y,z)->point. N facets, facet 0 starts at +y going up. */
export function tubeSecs(st, N = 16, map) {
  map = map || ((x, y, z) => [x, y, z]);
  const s = st.map(q => { const a = []; for (let k = 0; k < N; k++) { const t = k / N * Math.PI * 2; a.push(map(q.x, q.y + q.ry * Math.cos(t), q.z + q.rz * Math.sin(t))); } return a; });
  s.sort((a, b) => a[0][0] - b[0][0]); return s;
}
/** point on a tube surface at station coordinate x and angle a (radians, 0 = +y, PI/2 = top) */
export function tpt(st, x, a) {
  let i = 0; while (i < st.length - 2 && st[i + 1].x < x) i++;
  const p = st[i], q = st[i + 1], t = Math.max(0, Math.min(1, (x - p.x) / ((q.x - p.x) || 1))), L = (m) => p[m] + (q[m] - p[m]) * t;
  return [x, L('y') + L('ry') * Math.cos(a), L('z') + L('rz') * Math.sin(a)];
}
/** extrude a (y,z) profile along x from x0 to x1. profile ordered from +y side over the top to -y side. */
export function extrudeX(prof, x0, x1, o) {
  loft([prof.map(q => [x0, q[0], q[1]]), prof.map(q => [x1, q[0], q[1]])], o);
}
/** end wall under a profile at plane x (faces +x): strips from zb up to the profile */
export function gableX(prof, x, zb, h, h2) {
  for (let i = 0; i < prof.length - 1; i++) { const a = prof[i], b = prof[i + 1]; fq([[x, a[0], zb], [x, b[0], zb], [x, b[0], b[1]], [x, a[0], a[1]]], h, h2); }
}
/** vertical curved wall: arc centred (cx,cy) radius r from angle a0 to a1 (radians, 0 = +x, PI/2 = +y), z0..z1 */
export function arcWall(cx, cy, r, a0, a1, z0, z1, col, o) {
  o = o || {}; const n = o.n || 10, r1 = o.r1 === undefined ? r : o.r1;
  for (let i = 0; i < n; i++) {
    const t0 = a0 + (a1 - a0) * i / n, t1 = a0 + (a1 - a0) * (i + 1) / n, tm = (t0 + t1) / 2, nx = Math.cos(tm), ny = Math.sin(tm);
    if (nx + ny <= 0) continue;
    const c = typeof col === 'function' ? col(i, n) : col; if (!c) continue;
    const g0 = o.gap ? (t1 - t0) * o.gap : 0;
    fq([[cx + r * Math.cos(t0 + g0), cy + r * Math.sin(t0 + g0), z0], [cx + r * Math.cos(t1 - g0), cy + r * Math.sin(t1 - g0), z0], [cx + r1 * Math.cos(t1 - g0), cy + r1 * Math.sin(t1 - g0), z1], [cx + r1 * Math.cos(t0 + g0), cy + r1 * Math.sin(t0 + g0), z1]], o.flat ? c : shade(c, [nx, ny, 0]), o.h2);
  }
}
/** glass curtain wall on a +y face: panels of width sx, rows of height sz, lit at night. o:{on:fn(i,j)->bool, frame} */
export function curtainY(x0, x1, y, z0, z1, o) {
  o = o || {}; const nx = Math.max(1, Math.round((x1 - x0) / (o.sx || 1))), nz = Math.max(1, Math.round((z1 - z0) / (o.sz || 1))), sx = (x1 - x0) / nx, sz = (z1 - z0) / nz;
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const k = ((i - j) % 5 + 5) % 5, g = k === 0 ? ['#a9d8e8', '#bfe4ee'] : k === 1 ? ['#86c2d8', '#9fd0e2'] : [AP.glassA, '#7fbfd6'];
    winY(x0 + i * sx, x0 + (i + 1) * sx, y, z0 + j * sz, z0 + (j + 1) * sz, { on: o.on ? o.on(i, j) : true, glass: g, frame: o.frame || '#55627a', glowc: o.glowc });
  }
}
export function curtainX(x, y0, y1, z0, z1, o) {
  o = o || {}; const ny = Math.max(1, Math.round((y1 - y0) / (o.sx || 1))), nz = Math.max(1, Math.round((z1 - z0) / (o.sz || 1))), sy = (y1 - y0) / ny, sz = (z1 - z0) / nz;
  for (let j = 0; j < nz; j++) for (let i = 0; i < ny; i++) {
    const k = ((i + j) % 5 + 5) % 5, g = k === 0 ? ['#8cc4d8', '#a2d2e2'] : [AP.glassD, '#5fa3c0'];
    winX(x, y0 + i * sy, y0 + (i + 1) * sy, z0 + j * sz, z0 + (j + 1) * sz, { on: o.on ? o.on(i, j) : true, glass: g, frame: o.frame || '#46526a', glowc: o.glowc });
  }
}
/** sliding glass double door on a +y wall, centred at x, width w */
export function glassDoorY(x, y, w = 1.6, h = 1.8) {
  qy(x - w / 2 - .1, x + w / 2 + .1, y, 0, h + .12, AP.dark);
  winY(x - w / 2, x - .03, y, .08, h, { on: true, glass: ['#a9d8e8', '#c4e6ef'], frame: '#2e3644' });
  winY(x + .03, x + w / 2, y, .08, h, { on: true, glass: ['#a9d8e8', '#c4e6ef'], frame: '#2e3644' });
  lw([x - .12, y, .9], [x - .12, y, 1.1], '#e8e2d4'); lw([x + .12, y, .9], [x + .12, y, 1.1], '#e8e2d4');
  qy(x - w / 2, x + w / 2, y, 0, .08, '#8a8f98');
}
/** helper for vehicles lying along x: returns mirrored primitives for p.dir */
export function along(dir, L) {
  const f = dir !== -1;
  return {
    f, X: x => f ? x : L - x,
    B: (x, y, z, w, d, h, c, o) => box(f ? x : L - x - w, y, z, w, d, h, c, o),
    QY: (x0, x1, y, z0, z1, h, h2) => f ? qy(x0, x1, y, z0, z1, h, h2) : qy(L - x1, L - x0, y, z0, z1, h, h2),
    QZ: (x0, x1, y0, y1, z, h, h2) => f ? qz(x0, x1, y0, y1, z, h, h2) : qz(L - x1, L - x0, y0, y1, z, h, h2),
    WY: (x0, x1, y, z0, z1, o) => f ? winY(x0, x1, y, z0, z1, o) : winY(L - x1, L - x0, y, z0, z1, o),
    P: (x, y, z) => [f ? x : L - x, y, z],
    W: (x, y, z, r, hub) => wheel(f ? x : L - x, y, z, r, hub),
  };
}
export { ring };

/** tiny bitmap on a wall. rows = strings, pal = {char: hex}; top-left at (x,y,z) like wtext. */
export function bmp(face, rows, x, y, z, pal, k = 1) {
  const W = rows[0].length * k, fl = isFlipped(); let s, sl;
  if (face === 'y') { s = fl ? PW(x + W / U, y, z) : PW(x, y, z); sl = fl ? -1 : 1; } else { s = fl ? PW(x, y - W / U, z) : PW(x, y, z); sl = fl ? 1 : -1; }
  const X = Math.round(s[0]), Y = Math.round(s[1]);
  rows.forEach((row, r) => { for (let b = 0; b < row.length; b++) { const h = pal[row[b]]; if (!h) continue; const c = C(h); for (let a = 0; a < k; a++) for (let e = 0; e < k; e++) { const u = b * k + a; px(X + u, Y + sl * (u >> 1) + r * k + e, c); } } });
}
export const LEAF = ['....#....', '...###...', '.#.###.#.', '.#######.', '#########', '.#######.', '..#####..', '....#....', '....#....'];
/** annulus (ring) on a horizontal plane, drawn as quads so it can be dithered */
export function ringZ(x, y, z, r0, r1, h, h2, n = 24) { for (let i = 0; i < n; i++) { const a = i / n * 6.2832, b = (i + 1) / n * 6.2832; fq([[x + r0 * Math.cos(a), y + r0 * Math.sin(a), z], [x + r1 * Math.cos(a), y + r1 * Math.sin(a), z], [x + r1 * Math.cos(b), y + r1 * Math.sin(b), z], [x + r0 * Math.cos(b), y + r0 * Math.sin(b), z]], h, h2); } }

/** extrude an (x,z) profile along y from y0 to y1. profile ordered from the +x side over the top to -x. */
export function extrudeY(prof, y0, y1, o) { loft([prof.map(q => [q[0], y1, q[1]]), prof.map(q => [q[0], y0, q[1]])], o); }
/** end wall under an (x,z) profile at plane y (faces +y) */
export function gableY(prof, y, zb, h, h2) { for (let i = 0; i < prof.length - 1; i++) { const a = prof[i], b = prof[i + 1]; fq([[a[0], y, zb], [b[0], y, zb], [b[0], y, b[1]], [a[0], y, a[1]]], h, h2); } }
/** tiny parked car seen side-on against a +y plane */
export function sideCar(x, y, z, c, dir = 1) {
  qy(x, x + 2.5, y, z + .15, z + .62, c); qy(x + (dir > 0 ? .55 : .35), x + (dir > 0 ? 2.15 : 1.95), y, z + .62, z + 1.0, dk(c, .1)); qy(x + (dir > 0 ? .7 : .5), x + (dir > 0 ? 2.0 : 1.8), y, z + .66, z + .94, '#34425a');
  qy(x + .35, x + .8, y, z, z + .32, '#1d1c26'); qy(x + 1.7, x + 2.15, y, z, z + .32, '#1d1c26'); lw([x, y, z + .15], [x + 2.5, y, z + .15], dk(c, .5));
}
