// Shared helpers for the transit art folder (vehicles, rail, station, road furniture).
import { PW, px, C, fq, lw, qx, qy, qz, box, pal, dk, lt, mix, glow, lit, isFlipped, U, textW, signY, signX, rng } from '../../engine/raster.js';

/* ---------- shared dimensions (world units) — see the report / planner notes ---------- */
export const RAIL = {
  DECK_W: 6,        // viaduct deck width across (y)
  SLAB: .6,         // deck thickness: local z 0 = deck underside, z .6 = track bed (trains stand here)
  TRACK_Y: [1.7, 4.3], // track centre lines across the deck
  GAUGE: .55,       // rail offset from the track centre
  PLAT_TOP: 1.2,    // platform top above the deck underside (= .6 above the track bed = train floor)
  PLAT_W: 3,        // side platform width
  WIRE: 4.1,        // contact wire height above the deck underside (3.5 above the bed)
  NOMINAL: 5,       // nominal track-bed height above the street -> piers are 4.4 tall
};
export const COL = {
  glassA: '#2b3654', glassB: '#3a4a6e', glassHi: '#7f9cc0', tyre: '#25212d', rim: '#aab0ba', chrome: '#c9ced6',
  head: '#fff6cf', tail: '#ff3b3b', amber: '#ffb347', warm: '#ffe6a8', warm2: '#f5d48a', under: '#2a2634',
  conc: '#b9b4a8', concD: '#a39e93', steel: '#56636b', steelD: '#3d4a54', rail: '#d9dde2', sleeper: '#6b5a4a',
  yellow: '#f2c230', snow: '#f4f8fb', green: '#3f9a6a', red: '#e0453a',
};

/** disc on a wall plane. plane 'y' (faces +y) or 'x' (faces +x). fn(a, b, d) -> hex|null; a = px along the wall, b = px up, d = distance in px */
export function disc(plane, x, y, z, r, fn) {
  const s = PW(x, y, z), cx = Math.round(s[0]), cy = Math.round(s[1]), f = ((plane === 'x') !== isFlipped()) ? -1 : 1, R = Math.ceil(r * U) + 1, rp = r * U;
  for (let Y = -2 * R; Y <= 2 * R; Y++) for (let X = -R; X <= R; X++) {
    const a = f * X, b = (a >> 1) - Y, d = Math.sqrt(a * a + b * b); if (d > rp + .35) continue;
    const h = typeof fn === 'function' ? fn(a, b, d, rp) : fn; if (h) px(cx + X, cy + Y, C(h));
  }
}
/** car wheel on the +y side: centre (x,y,z), radius r */
export function wheel(x, y, z, r, hub) {
  disc('y', x, y, z + .02, r + .07, COL.under);
  disc('y', x, y, z, r, (a, b, d, rp) => d > rp - 1.6 ? COL.tyre : d < .8 ? '#5a606c' : (hub || COL.rim));
}
/** soft night-only halo (screen-space diamond, dithered) around a world point */
export function halo(x, y, z, r, hex) {
  const s = PW(x, y, z), cx = Math.round(s[0]), cy = Math.round(s[1]), c = C(hex);
  glow(() => { for (let Y = -r; Y <= r; Y++) for (let X = -r; X <= r; X++) { const d = Math.abs(X) + Math.abs(Y); if (d > r) continue; if (d > r * .55 && ((X + Y) & 1)) continue; px(cx + X, cy + Y, c); } });
}
/** small lamp: lit pixels (w x h px) at a world anchor + halo */
export function lamp(x, y, z, hex, r = 3, w = 2, h = 2) {
  if (r) halo(x, y, z, r, mix(hex, '#ffffff', .25));
  const s = PW(x, y, z), cx = Math.round(s[0]), cy = Math.round(s[1]), c = C(hex);
  lit(() => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(cx + i - (w >> 1), cy + j - (h >> 1), c); });
}
/** thin square post */
export const post = (x, y, z, h, c, t = .1) => box(x - t / 2, y - t / 2, z, t, t, h, c, { ol: false });
/** outlined thin post */
export const pole = (x, y, z, h, c, t = .14) => box(x - t / 2, y - t / 2, z, t, t, h, c);

/**
 * Extrude a side profile along y. pts = [[x,zTop],...] with non-decreasing x (repeat x for vertical steps),
 * solid between zb and the profile, from y0 to y1. Draws tops (shaded by slope), the +y side and +x-facing steps.
 * o: { t, l, r: colours; ol:false; base:false (no bottom outline) }
 */
export function prof(pts, y0, y1, zb, col, o) {
  o = o || {}; const p = pal(col), top = o.t || p.t, side = o.l || p.l, rc = o.r || p.r, n = pts.length;
  for (let i = 0; i < n - 1; i++) {
    const [xa, za] = pts[i], [xb, zc] = pts[i + 1];
    if (xb - xa < 1e-6) { if (zc < za) qx(xa, y0, y1, zc, za, rc); continue; }
    const s = (zc - za) / (xb - xa);
    if (s < 1) fq([[xa, y0, za], [xb, y0, zc], [xb, y1, zc], [xa, y1, za]], s === 0 ? top : s > 0 ? dk(top, .08 + .1 * Math.min(1, s)) : mix(top, rc, Math.min(1, -s) * .7));
    fq([[xa, y1, zb], [xb, y1, zb], [xb, y1, zc], [xa, y1, za]], side);
  }
  const [x0, z0] = pts[0], [xn, zn] = pts[n - 1];
  if (zn > zb) qx(xn, y0, y1, zb, zn, rc);
  if (o.ol === false) return;
  for (let i = 0; i < n - 1; i++) lw([pts[i][0], y0, pts[i][1]], [pts[i + 1][0], y0, pts[i + 1][1]], p.o);
  lw([x0, y0, z0], [x0, y1, z0], p.o); lw([x0, y1, z0], [x0, y1, zb], p.o);
  if (o.base !== false) { lw([x0, y1, zb], [xn, y1, zb], p.o); lw([xn, y1, zb], [xn, y0, zb], p.o); }
  lw([xn, y0, zb], [xn, y0, zn], p.o);
  for (let i = 0; i < n - 1; i++) { const v = pts[i + 1][0] - pts[i][0] < 1e-6; lw([pts[i][0], y1, pts[i][1]], [pts[i + 1][0], y1, pts[i + 1][1]], v ? p.m : (o.hi || p.h)); }
  if (zn > zb) { lw([xn, y1, zn], [xn, y1, zb], p.m); lw([xn, y0, zn], [xn, y1, zn], p.h); }
}

/**
 * Vehicle builder. Vehicle coords: u = 0 at the REAR, u = len at the FRONT; mapped onto x by p.dir.
 * Returns helpers that take u coordinates so one description serves both directions.
 */
export function mk(p, len, wid, defCol) {
  const f = p.dir !== -1, col = p.color || defCol, P = pal(col), on = p.lights !== false && !p.parked;
  const X = u => f ? u : len - u;
  const K = {
    f, col, P, len, wid, on, X,
    /** doors of a right-hand-traffic vehicle are on its right side: is that the visible long side? */
    curb: f !== isFlipped(),
    pts: a => f ? a : a.map(([u, z]) => [len - u, z]).reverse(),
    /** run parts back-to-front: list of [u, fn] */
    seq(list) { list.slice().sort((a, b) => X(a[0]) - X(b[0])).forEach(q => q[1]()); },
    /** headlight beam on the road (night only). Call FIRST. */
    beam(z = 0) {
      if (!on || p.beam === false) return;
      const a = X(len), b = X(len + 2.4), m = X(len + 1.3);
      glow(() => { fq([[a, .15, z + .02], [b, -.3, z + .02], [b, wid + .3, z + .02], [a, wid - .15, z + .02]], '#4a4c6c'); fq([[a, .25, z + .02], [m, .1, z + .02], [m, wid - .1, z + .02], [a, wid - .25, z + .02]], '#726f7c'); });
    },
    chassis(zb, a = .12, b = len - .12) { const x0 = Math.min(X(a), X(b)); box(x0, .06, .1, Math.abs(b - a), wid - .1, zb - .1 + .02, COL.under, { ol: false }); lw([x0, wid, .1], [x0 + Math.abs(b - a), wid, .1], dk(COL.under, .4)); },
    body(pts, y0, y1, zb, c, o) { prof(K.pts(pts), y0, y1, zb, c || col, o); },
    /** box spanning u0..u1 */
    box(u0, u1, y0, y1, z0, z1, c, o) { box(Math.min(X(u0), X(u1)), y0, z0, Math.abs(u1 - u0), y1 - y0, z1 - z0, c, o); },
    /** flat polygon on a constant-y plane, pts in [u,z] */
    polyY(pts, y, h, h2) { fq(pts.map(q => [X(q[0]), y, q[1]]), h, h2); },
    rectY(u0, u1, y, z0, z1, h, h2) { qy(Math.min(X(u0), X(u1)), Math.max(X(u0), X(u1)), y, z0, z1, h, h2); },
    lineY(u0, z0, u1, z1, y, h) { lw([X(u0), y, z0], [X(u1), y, z1], h); },
    /** glass polygon on the side with a glint; night: optional interior glow */
    glassY(pts, y, o) {
      o = o || {}; K.polyY(pts, y, o.a || COL.glassA, o.b || COL.glassB);
      let hi = pts[0]; for (const q of pts) if (q[1] - (f ? q[0] : -q[0]) * .3 > hi[1] - (f ? hi[0] : -hi[0]) * .3) hi = q;
      if (o.glint !== false) { const s = PW(X(hi[0]), y, hi[1]), g = C(COL.glassHi), d = isFlipped() ? -1 : 1; px(Math.round(s[0]) + d * (f ? 2 : 1), Math.round(s[1]) + 2, g); px(Math.round(s[0]) + d * (f ? 3 : 2), Math.round(s[1]) + 3, g); }
      if (o.glow) glow(() => K.polyY(pts, y, o.glow[0], o.glow[1]));
      if (o.frame !== false) for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; lw([X(a[0]), y, a[1]], [X(b[0]), y, b[1]], o.frame || dk(col, .62)); }
    },
    /** glass on a sloped/flat top surface between profile points (ua,za)-(ub,zb), y0..y1 */
    glassT(ua, za, ub, zb, y0, y1, o) {
      const xa = X(ua), xb = X(ub), [x0, z0, x1, z1] = xa < xb ? [xa, za, xb, zb] : [xb, zb, xa, za]; if (x1 - x0 > 1e-6 && (z1 - z0) / (x1 - x0) >= 1) return;
      o = o || {}; const q = [[x0, y0, z0], [x1, y0, z1], [x1, y1, z1], [x0, y1, z0]];
      const front = z1 < z0; fq(q, o.a || (front ? '#34466a' : COL.glassA), o.b || (front ? '#46608a' : COL.glassB));
      if (o.glow) glow(() => fq(q, o.glow[0], o.glow[1]));
      const fr = o.frame || dk(col, .62); for (let i = 0; i < 4; i++) lw(q[i], q[(i + 1) % 4], fr);
      if (front) lw([x0 + (x1 - x0) * .25, y1 - .12, z0 + (z1 - z0) * .25], [x0 + (x1 - x0) * .7, y1 - .12, z0 + (z1 - z0) * .7], COL.glassHi);
    },
    /** standard cabin: trapezoid/polygon cab profile on top of the body, with side glass + windscreen + rear glass */
    cabin(cab, ins, belt, c, o) {
      o = o || {}; const y0 = ins, y1 = wid - ins; K.body(cab, y0, y1, belt, c || col, { base: false, hi: o.hi });
      let u0 = 1e9, u1 = -1e9, zt = -1e9; for (const q of cab) { u0 = Math.min(u0, q[0]); u1 = Math.max(u1, q[0]); zt = Math.max(zt, q[1]); }
      const uc = (u0 + u1) / 2, zc = (belt + zt) / 2, ku = 1 - 2 * (o.pu || .13) / (u1 - u0), kz = 1 - 2 * (o.pz || .075) / (zt - belt);
      const g = cab.map(q => [uc + (q[0] - uc) * ku, zc + .01 + (q[1] - zc) * kz]);
      K.glassY(g, y1, o);
      for (const b of (o.pillars || [])) { K.lineY(b, belt, b, zt - .04, y1, dk(c || col, .25)); }
      for (const i of [0, cab.length - 2]) { const a = cab[i], b = cab[i + 1]; if (Math.abs(b[1] - a[1]) < .05 || Math.abs(b[0] - a[0]) < .04) continue; const t0 = .16, t1 = .86; K.glassT(a[0] + (b[0] - a[0]) * (a[1] < b[1] ? t0 : 1 - t1), a[1] + (b[1] - a[1]) * (a[1] < b[1] ? t0 : 1 - t1), a[0] + (b[0] - a[0]) * (a[1] < b[1] ? t1 : 1 - t0), a[1] + (b[1] - a[1]) * (a[1] < b[1] ? t1 : 1 - t0), y0 + .1, y1 - .1, o); }
    },
    wheels(us, r, o) { for (const u of us) wheel(X(u), wid, r, r, o && o.hub); },
    /** the visible +x end: front (grille + headlights) or rear (tail lights + plate). zb..zt = face extent */
    end(zb, zt, o) {
      o = o || {}; const x = Math.max(X(0), X(len)), lw2 = o.lw || .34, lh = o.lh || .16, lz = o.lz !== undefined ? o.lz : zt - lh - .1, e = o.inset || .1;
      if (o.bumper !== false) { qx(x, .04, wid - .04, zb, zb + .1, o.bumperc || '#8d939e'); }
      if (f) {
        if (o.grille !== false) { qx(x, e + lw2 + .06, wid - e - lw2 - .06, o.gz0 !== undefined ? o.gz0 : lz - .02, o.gz1 !== undefined ? o.gz1 : lz + lh, o.grillec || '#2c2a36', o.grille2 || '#3d3b49'); }
        if (o.plate !== false) qx(x, wid / 2 - .2, wid / 2 + .2, zb + .12, zb + .22, '#f1ede0');
        const d = () => { qx(x, e, e + lw2, lz, lz + lh, COL.head); qx(x, wid - e - lw2, wid - e, lz, lz + lh, COL.head); };
        if (on) { halo(x, e + lw2 / 2, lz + lh / 2, 4, '#fff8dc'); halo(x, wid - e - lw2 / 2, lz + lh / 2, 4, '#fff8dc'); lit(d); } else d();
      } else {
        if (o.plate !== false) qx(x, wid / 2 - .22, wid / 2 + .22, lz - .02, lz + .1, '#f1ede0');
        const d = () => { qx(x, e, e + lw2, lz, lz + lh, COL.tail); qx(x, wid - e - lw2, wid - e, lz, lz + lh, COL.tail); };
        if (on) { halo(x, e + lw2 / 2, lz + lh / 2, 3, '#ff6a5a'); halo(x, wid - e - lw2 / 2, lz + lh / 2, 3, '#ff6a5a'); lit(d); } else d();
      }
    },
    /** side markers wrapping onto the +y side: white/amber at the front corner, red at the rear corner */
    markers(zf, zr, o) {
      const d = () => { K.rectY(len - .14, len - .02, wid, zf, zf + .12, o && o.fc || '#ffd98a'); };
      const e = () => { K.rectY(.02, .14, wid, zr, zr + .12, COL.tail); };
      if (on) lit(() => { d(); e(); }); else { d(); e(); }
    },
    doorLine(u, z0, z1, c) { K.lineY(u, z0, u, z1, wid, c || dk(col, .3)); },
    handle(u, z) { K.lineY(u, z, u + .14, z, wid, dk(col, .55)); },
    /** door mirror at the windscreen base */
    mirror(u, z) { K.box(u, u + .1, wid, wid + .1, z, z + .1, dk(col, .35), { ol: false }); },
    /** winter snow cap for parked vehicles on a flat roof span */
    snow(u0, u1, y0, y1, z) { const a = Math.min(X(u0), X(u1)), b = Math.max(X(u0), X(u1)); qz(a, b, y0, y1, z + .02, COL.snow); qz(a - .06, b + .06, y0 - .04, y1 + .04, z + .02, COL.snow, 'glass'); },
  };
  return K;
}

/** row of lit-at-night windows with passenger silhouettes on a +y side. xs = [[x0,x1],...] */
export function paxWindows(xs, y, z0, z1, seed, o) {
  o = o || {}; const r = rng(seed || 7), fr = o.frame || '#2a2634';
  for (const [x0, x1] of xs) {
    qy(x0, x1, y, z0, z1, o.a || COL.glassA, o.b || COL.glassB);
    const s = PW(x0, y, z1), g = C(COL.glassHi), d = isFlipped() ? -1 : 1; for (let k = 1; k <= 3; k++) px(Math.round(s[0]) + d * (k + 1), Math.round(s[1]) + k + 1 + (k >> 1) , g);
    glow(() => {
      qy(x0, x1, y, z0, z1, COL.warm, COL.warm2);
      for (let hx = x0 + .22; hx < x1 - .15; hx += .42) if (r() < (o.pax === undefined ? .55 : o.pax)) { const c = ['#6b4a3a', '#3d4a6a', '#7a3a4a', '#4a6a55', '#8a6a3a'][Math.floor(r() * 5)]; qy(hx, hx + .22, y, z0, z0 + .26, c); qy(hx + .03, hx + .19, y, z0 + .26, z0 + .42, dk(c, .25)); }
    });
    lw([x0, y, z0], [x1, y, z0], fr); lw([x0, y, z1], [x1, y, z1], fr); lw([x0, y, z0], [x0, y, z1], fr); lw([x1, y, z0], [x1, y, z1], fr);
  }
}
/** dark LED panel with glowing text on a +y wall */
export const ledY = (str, x0, x1, y, z0, z1, fg, bg) => signY(str, x0, x1, y, z0, z1, bg || '#1b2026', fg || COL.amber, { lit: true });
export const ledX = (str, x, y0, y1, z0, z1, fg, bg) => signX(str, x, y0, y1, z0, z1, bg || '#1b2026', fg || COL.amber, { lit: true });
/** width in world units of a 3x5 string (+pad px) */
export const tw = (s, pad = 4) => (textW(String(s)) + pad) / U;
/** snow blanket on a flat top */
export function snowTop(x0, x1, y0, y1, z) { qz(x0, x1, y0, y1, z, COL.snow, '#e3ebf2'); }
