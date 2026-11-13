// Shared helpers for src/art/props (nature + street + park props). Not an asset module (no default export).
// Everything here goes through raster.js primitives / PW(), so flip, glow/lit modes and at() offsets all keep working.
import { PW, px, C, U, ENV, dk, lt, mix, hash2, rng, ellipse, qz, qy, qx, lw, box, foliage, glow, lit } from '../../engine/raster.js';

export const SNOW = '#f4f8fb', SNOW2 = '#cfdcea', BARK = '#6b4a2f', IRON = '#3d4a54', IRON2 = '#2f3942', WOOD = '#b07444', STONE = '#b9b4a8';
export const WARM = '#fff2c4', WARM2 = '#ffd98a';
export const P = (x, y, z) => { const s = PW(x, y, z); return [Math.round(s[0]), Math.round(s[1])]; };
export const season = () => ENV.season;
export const winter = () => ENV.season === 3;
export const sizeK = p => typeof p.size === 'number' ? p.size : ({ small: .72, medium: 1, large: 1.3 })[p.size] || 1;
export const pick = (r, a) => a[Math.floor(r() * a.length) % a.length];
/** deciduous leaf colour (null in winter) with an optional tint mix; idx picks an exact entry of the seasonal palette */
export function leafC(idx = 0, tint, k = .25) {
  const n = [3, 4, 5, 1][ENV.season], c = foliage('leaf', ((idx % n) + .5) / n); if (!c) return null; return tint ? mix(c, tint, k) : c;
}
/** evergreen colour for every season (hedges, holly, conifers) */
export const everC = (idx = 0, tint, k = .25) => { const c = foliage('pine', ((idx % 3) + .5) / 3); return tint ? mix(c, tint, k) : c; };

/* ---------- thin structural bits ---------- */
/** vertical pole w px wide (lit from the left), optional 1px outline */
export function pole(x, y, z0, z1, c, w = 2, ol = true) {
  const a = P(x, y, z0), b = P(x, y, z1), cl = C(lt(c, .28)), cm = C(c), cd = C(dk(c, .3)), oc = C(dk(c, .7)), x0 = a[0] - (w >> 1);
  for (let Y = b[1]; Y <= a[1]; Y++) { for (let i = 0; i < w; i++) px(x0 + i, Y, w === 1 ? cm : i === 0 ? cl : i === w - 1 ? cd : cm); if (ol) { px(x0 - 1, Y, oc); px(x0 + w, Y, oc); } }
  if (ol) for (let i = 0; i < w; i++) { px(x0 + i, b[1] - 1, oc); px(x0 + i, a[1] + 1, oc); }
}
/** thick line between world points, width tapering w0 -> w1 px. snow: white pixels on top of flat runs */
export function limb(a, b, c, w0 = 2, w1 = w0, snow = false) {
  const A = PW(a[0], a[1], a[2]), B = PW(b[0], b[1], b[2]), dx = B[0] - A[0], dy = B[1] - A[1], n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))));
  const cm = C(c), cl = C(lt(c, .22)), cs = C(SNOW), flat = Math.abs(dx) > Math.abs(dy) * 1.2;
  for (let i = 0; i <= n; i++) {
    const t = i / n, X = Math.round(A[0] + dx * t), Y = Math.round(A[1] + dy * t), w = Math.max(1, Math.round(w0 + (w1 - w0) * t));
    for (let k = 0; k < w; k++) { if (flat) px(X, Y + k - (w >> 1), k === 0 && w > 1 ? cl : cm); else px(X + k - (w >> 1), Y, k === 0 && w > 1 ? cl : cm); }
    if (snow && Math.abs(dx) > Math.abs(dy) * .6 && (i + (X >> 2)) % 9 < 6) px(X, Y - (flat ? (w >> 1) : 0) - 1, cs);
  }
}
/** tapered trunk between world points; widths in px. o.mark(u, v, k) -> hex|null for bark marks, o.noflare */
export function trunk(a, b, wb, wt, c, o = {}) {
  const A = P(a[0], a[1], a[2]), B = P(b[0], b[1], b[2]), cl = C(lt(c, .2)), cm = C(c), cd = C(dk(c, .3)), oc = C(dk(c, .68)), hgt = Math.max(1, A[1] - B[1]);
  let bx0 = 0, bx1 = 0;
  for (let Y = A[1]; Y >= B[1]; Y--) {
    const v = A[1] - Y, t = v / hgt, cx = A[0] + (B[0] - A[0]) * t; let hw = (wb + (wt - wb) * t) / 2; if (!o.noflare && v < 3) hw += (3 - v) * .5;
    const x0 = Math.round(cx - hw), x1 = Math.max(x0, Math.round(cx + hw) - 1);
    for (let X = x0; X <= x1; X++) {
      const k = (X - x0) / Math.max(1, x1 - x0); let col = k < .34 ? cl : k < .72 ? cm : cd;
      const m = o.mark ? o.mark(X - x0, v, k) : (hash2(X, v >> 2, 5) < .13 && (v & 3) !== 3 ? dk(c, .42) : null); if (m) col = C(m);
      px(X, Y, col);
    }
    px(x0 - 1, Y, oc); px(x1 + 1, Y, oc); if (Y === A[1]) { bx0 = x0; bx1 = x1; }
  }
  for (let X = bx0; X <= bx1; X++) px(X, A[1] + 1, oc);
}
export const birchMark = (u, v, k) => ((v % 6 === 2 && hash2(u >> 1, v, 3) < .55) || (v % 9 === 5 && k > .5)) ? '#3a3440' : null;

/* ---------- ground bits ---------- */
/** flat ellipse on the ground (circle of world radius r) */
export function disc(x, y, z, r, c, c2) { const s = PW(x, y, z); ellipse(s[0], s[1], r * U * 1.414, r * U * .707, c, c2); }
/** soft dithered contact shadow */
export function shadow(x, y, z, r) { disc(x, y, z, r, '#2a1f4548', 'glass'); }
/** n scattered ground pixels (fallen leaves, petals, pebbles) within radius r */
export function scatter(x, y, z, r, cols, n, seed = 1) {
  const R = rng(seed * 31 + 7);
  for (let i = 0; i < n; i++) { const a = R() * 6.283, d = Math.sqrt(R()) * r, s = P(x + Math.cos(a) * d, y + Math.sin(a) * d, z), c = C(cols[i % cols.length]); px(s[0], s[1], c); if (R() < .4) px(s[0] + 1, s[1], c); }
}
/** winter snow cap on a horizontal rectangle (dithered rim). No-op outside winter unless force */
export function snowTop(x0, x1, y0, y1, z, force) {
  if (!winter() && !force) return; const i = Math.min(.1, (x1 - x0) / 4, (y1 - y0) / 4);
  qz(x0, x1, y0, y1, z, SNOW, 'glass'); qz(x0 + i, x1 - i, y0 + i, y1 - i, z, SNOW);
}
/** small snow mound (winter only unless force) */
export function snowMound(x, y, z, r, force) { if (!winter() && !force) return; const s = PW(x, y, z); ellipse(s[0], s[1] - 1, r * U * 1.3, r * U * .6, SNOW, SNOW2); ellipse(s[0] - 1, s[1] - 2, r * U * 1.0, r * U * .4, SNOW); }

/* ---------- foliage masses ---------- */
/**
 * Leafy mass built from overlapping blobs [{x,y,z,r,c,sq}] (world coords, r in world units), shaded as ONE canopy:
 * bumpy silhouette, clumped highlights, shared outline. o: { seed, bump, gap (0..1 see-through holes), snow (bool: white tops),
 * dots: { c:[hex], p: density, big } (blossom / fruit), flat: less global shading }
 */
export function clumps(blobs, o = {}) {
  if (!blobs.length) return; const seed = o.seed | 0, bump = o.bump === undefined ? .1 : o.bump;
  const B = blobs.map((b, i) => { const s = PW(b.x, b.y, b.z), R = Math.max(2, b.r * U * 1.15); return { cx: s[0], cy: s[1], R, Ry: R * (b.sq || .82), nb: Math.max(5, Math.round(R / 2.3)), ph: hash2(i, 7, seed) * 6.283, pal: [lt(b.c, .3), b.c, dk(b.c, .2), dk(b.c, .4), dk(b.c, .66)].map(C) }; });
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const b of B) { x0 = Math.min(x0, b.cx - b.R * 1.15); x1 = Math.max(x1, b.cx + b.R * 1.15); y0 = Math.min(y0, b.cy - b.Ry * 1.15); y1 = Math.max(y1, b.cy + b.Ry * 1.15); }
  x0 = Math.floor(x0) - 2; y0 = Math.floor(y0) - 2; x1 = Math.ceil(x1) + 2; y1 = Math.ceil(y1) + 2; const W = x1 - x0 + 1, H = y1 - y0 + 1, m = new Int16Array(W * H).fill(-1);
  let ty = 1e9, by = -1e9;
  B.forEach((b, i) => {
    for (let Y = Math.floor(b.cy - b.Ry * 1.15); Y <= Math.ceil(b.cy + b.Ry * 1.15); Y++) for (let X = Math.floor(b.cx - b.R * 1.15); X <= Math.ceil(b.cx + b.R * 1.15); X++) {
      const a = (X + .5 - b.cx) / b.R, bb = (Y + .5 - b.cy) / b.Ry, d = a * a + bb * bb; if (d > 1.3) continue;
      const rr = 1 + bump * Math.sin(Math.atan2(bb, a) * b.nb + b.ph); if (d >= rr * rr) continue;
      if (o.gap && hash2(X >> 1, Y >> 1, seed + 5) < o.gap && d > .2) continue;
      m[(Y - y0) * W + X - x0] = i; if (Y < ty) ty = Y; if (Y > by) by = Y;
    }
  });
  const gh = Math.max(1, by - ty), sn = C(SNOW), sn2 = C(SNOW2);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = m[j * W + i], X = x0 + i, Y = y0 + j;
    if (k < 0) { const n = (i > 0 && m[j * W + i - 1] >= 0) ? m[j * W + i - 1] : (i < W - 1 && m[j * W + i + 1] >= 0) ? m[j * W + i + 1] : (j > 0 && m[(j - 1) * W + i] >= 0) ? m[(j - 1) * W + i] : (j < H - 1 && m[(j + 1) * W + i] >= 0) ? m[(j + 1) * W + i] : -1; if (n >= 0 && o.ol !== false) px(X, Y, B[n].pal[4]); continue; }
    const b = B[k], a = (X + .5 - b.cx) / b.R, bb = (Y + .5 - b.cy) / b.Ry, g = .5 - (Y - ty) / gh;
    let v = (-a * .5 - bb * .8) * .72 + g * (o.flat ? .25 : .62) + (hash2(X >> 1, Y, seed) - .5) * .3;
    // the underside of a clump that overhangs another clump reads darker
    if (j < H - 2) { const u = m[(j + 2) * W + i]; if (u >= 0 && u < k && bb > .55) v -= .3; }
    if (o.snow && v > .3) { px(X, Y, v > .42 || ((X + Y) & 1) ? sn : sn2); continue; }
    px(X, Y, b.pal[v > .48 ? 0 : v > .02 ? 1 : v > -.42 ? 2 : 3]);
  }
  if (o.dots) {
    const D = o.dots, st = D.big ? 4 : 3;
    for (let j = 1; j < H - 2; j += st) for (let i = 1; i < W - 2; i += st) {
      const h = hash2(i, j, seed + 9); if (h >= D.p) continue; const ii = i + Math.floor(hash2(i, j, seed + 11) * st), jj = j + Math.floor(hash2(i, j, seed + 12) * st);
      if (ii >= W - 1 || jj >= H - 1 || m[jj * W + ii] < 0 || m[jj * W + ii + 1] < 0) continue;
      const c = D.c[Math.floor(h / D.p * D.c.length) % D.c.length], X = x0 + ii, Y = y0 + jj; px(X, Y, C(c)); if (D.big) { px(X + 1, Y, C(c)); px(X, Y + 1, C(dk(c, .25))); px(X + 1, Y + 1, C(dk(c, .25))); px(X, Y, C(lt(c, .4))); }
    }
  }
}

/** evergreen made of n drooping tiers. (x,y,z) = base centre, h total height, r base radius (world). o: { skirt, snow, jag } */
export function conifer(x, y, z, h, r, n, c, o = {}) {
  const sk = o.skirt === undefined ? .5 : o.skirt, snow = o.snow === undefined ? winter() : o.snow;
  const cl = C(c), ch = C(lt(c, .25)), cd = C(dk(c, .25)), cdd = C(dk(c, .45)), oc = C(dk(c, .7)), sn = C(SNOW), sn2 = C(SNOW2);
  pole(x, y, z, z + sk + .3, BARK, Math.max(2, Math.round(r * 3)), true);
  for (let i = 0; i < n; i++) {
    const zb = z + sk + (h - sk) * i / n, za = Math.min(z + h, zb + (h - sk) / n * (i === n - 1 ? 1 : 1.9)), ri = r * (1 - .78 * i / n);
    const A = PW(x, y, za), Bc = PW(x, y, zb), Rp = Math.max(2, ri * U * 1.3), ry = Rp * .36, ax = Math.round(A[0]);
    for (let dx = -Math.ceil(Rp); dx <= Math.ceil(Rp); dx++) {
      const k = dx / Rp; if (Math.abs(k) > 1) continue; const X = ax + dx;
      const yT = Math.round(A[1] + Math.abs(k) * (Bc[1] - A[1])), yB = Math.round(Bc[1] + ry * Math.sqrt(1 - k * k) - [0, 1, 2, 1][(dx + i * 2 + 400) & 3] * (o.jag === undefined ? 1 : o.jag));
      if (yB < yT) continue; const len = Math.max(1, yB - yT);
      for (let Y = yT; Y <= yB; Y++) {
        const f = (Y - yT) / len, left = k < -.08 + (((X + Y) & 1) ? .12 : 0); let col = left ? cl : cd;
        if (left && f < .6 && (X + Y * 2 + i) % 5 === 0) col = ch; if (!left && (X * 2 + Y + i) % 7 === 0) col = cdd;
        if (Y >= yB - 1 && i > 0) col = cdd; else if (Y >= yB - 1) col = cd;
        if (snow && f < .5 - Math.abs(k) * .25 + (hash2(X, i, 3) - .5) * .25) col = k < .1 ? sn : sn2;
        px(X, Y, col);
      }
      px(X, yT - 1, oc); px(X, yB + 1, oc);
    }
    px(ax - Math.ceil(Rp) - 1, Math.round(Bc[1]), oc); px(ax + Math.ceil(Rp) + 1, Math.round(Bc[1]), oc);
  }
}

/* ---------- deciduous tree generator ---------- */
/**
 * Broadleaf tree with a real branch skeleton (shown bare + snowy in winter) and a clumped canopy the rest of the year.
 * sp: { H, th (fork height), R (canopy radius), Rz (canopy half-height factor), N (clumps), br (clump radius / R), tw (trunk px), bark, mark,
 *       cols(i, r) -> canopy colour for clump i (or null), bump, gap, dots, zc (canopy centre 0..1 between fork and top), cx, cy }
 * returns { blobs, tips, k } for extras (strands, swings...)
 */
export function broadleaf(p, sp) {
  const r = rng((p.seed || 1) * 7919 + 13), k = sizeK(p), H = sp.H * k, th = sp.th * k, R = sp.R * k, cx = sp.cx === undefined ? .25 : sp.cx, cy = sp.cy === undefined ? .25 : sp.cy;
  const bark = sp.bark || BARK, tw = Math.max(2, Math.round((sp.tw || 5) * (.55 + .45 * k))), N = sp.N || 8, lean = (r() - .5) * .25 * k;
  const fork = [cx + lean, cy, th], zc = th + (H - th) * (sp.zc === undefined ? .52 : sp.zc), Rz = (H - th) * .5 * (sp.Rz || 1), lead = [cx + lean * 1.4, cy, th + (zc - th) * .9];
  const a0 = r() * 6.283, blobs = [], limbs = [], bare = !sp.cols(0, r);
  for (let i = 0; i < N; i++) {
    const u = (i + .5) / N, zf = 1 - 2 * u, rad = Math.sqrt(1 - zf * zf) * (.62 + .2 * r()), ang = a0 + i * 2.39996 + (r() - .5) * .4;
    const b = { x: fork[0] + Math.cos(ang) * R * rad, y: fork[1] + Math.sin(ang) * R * rad, z: zc + zf * Rz * .62 + (r() - .5) * .2 * k, r: R * (sp.br || .5) * (.82 + .36 * r()), sq: sp.sq || .82, c: null, i };
    b.z = Math.min(b.z, H - b.r * .75); blobs.push(b);
    const from = zf > .15 ? lead : fork, mid = [from[0] + (b.x - from[0]) * .45, from[1] + (b.y - from[1]) * .45, from[2] + (b.z - from[2]) * .62];
    limbs.push({ a: from, b: mid, w0: 3, w1: 2, d: b.x + b.y }, { a: mid, b: [b.x, b.y, b.z], w0: 2, w1: 1, d: b.x + b.y });
    for (let j = 0; j < 3; j++) { const an = ang + (j - 1) * .9 + (r() - .5) * .5, l = b.r * (.7 + .5 * r()); limbs.push({ a: [b.x, b.y, b.z], b: [b.x + Math.cos(an) * l, b.y + Math.sin(an) * l, b.z + b.r * (.25 + .7 * r())], w0: 1, w1: 1, d: b.x + b.y + .01, twig: 1 }); }
  }
  shadow(cx, cy, 0, Math.min(R * .75, 2.2));
  trunk([cx, cy, 0], fork, tw, Math.max(2, tw * .7), bark, { mark: sp.mark });
  trunk(fork, lead, Math.max(2, tw * .7), 2, bark, { mark: sp.mark, noflare: true });
  limbs.sort((a, b) => a.d - b.d);
  const big = k * sp.R > 1.5;
  for (const l of limbs) { if (!bare && l.twig) continue; limb(l.a, l.b, l.twig ? dk(bark, .12) : bark, big ? l.w0 : Math.max(1, l.w0 - 1), big ? l.w1 : 1, bare); }
  if (!bare) {
    blobs.forEach(b => { b.c = sp.cols(b.i, r); });
    blobs.sort((a, b) => (a.x + a.y + a.z * 1.3) - (b.x + b.y + b.z * 1.3));
    clumps(blobs, { seed: p.seed || 1, bump: sp.bump, gap: sp.gap, dots: typeof sp.dots === 'function' ? sp.dots(p) : sp.dots, snow: sp.snow && winter() });
  }
  return { blobs, k, H, R, fork, bare, r };
}

/* ---------- misc shared props bits ---------- */
/** warm lamp glow: a small bright core that is visible by day as pale glass and shines at night */
export function bulb(x, y, z, rpx = 2, c = WARM) {
  const s = P(x, y, z); ellipse(s[0], s[1], rpx, rpx, '#efe8d2'); glow(() => { ellipse(s[0], s[1], rpx + 1.5, rpx + 1.5, WARM2); ellipse(s[0], s[1], rpx, rpx, c); });
}
/** string of fairy lights between two world points, sagging by `sag` world units */
export function stringLights(a, b, sag = .3, cols = ['#ffd98a', '#ff8a7a', '#8ad0ff', '#b6f08a'], n) {
  const A = PW(a[0], a[1], a[2]), B = PW(b[0], b[1], b[2]), len = Math.hypot(B[0] - A[0], B[1] - A[1]), N = n || Math.max(3, Math.round(len / 4)); let prev = null;
  for (let i = 0; i <= N * 2; i++) { const t = i / (N * 2), X = Math.round(A[0] + (B[0] - A[0]) * t), Y = Math.round(A[1] + (B[1] - A[1]) * t + Math.sin(t * Math.PI) * sag * U); px(X, Y, C('#3a3440')); if (prev && Math.abs(prev[0] - X) > 1) px((prev[0] + X) >> 1, (prev[1] + Y) >> 1, C('#3a3440')); prev = [X, Y]; }
  lit(() => { for (let i = 0; i < N; i++) { const t = (i + .5) / N, X = Math.round(A[0] + (B[0] - A[0]) * t), Y = Math.round(A[1] + (B[1] - A[1]) * t + Math.sin(t * Math.PI) * sag * U) + 1; px(X, Y, C(cols[i % cols.length])); } });
}
/** little flowers: n blooms (2px with a stem pixel) inside the rectangle at height z */
export function blooms(x0, x1, y0, y1, z, cols, n, seed = 1, stem = '#4f9a45') {
  const R = rng(seed * 17 + 3), pts = [];
  for (let i = 0; i < n; i++) pts.push([x0 + R() * (x1 - x0), y0 + R() * (y1 - y0), cols[Math.floor(R() * cols.length)]]);
  pts.sort((a, b) => a[0] + a[1] - b[0] - b[1]);
  for (const q of pts) { const s = P(q[0], q[1], z); if (stem) px(s[0], s[1], C(stem)); px(s[0], s[1] - 1, C(q[2])); px(s[0] + 1, s[1] - 1, C(dk(q[2], .18))); px(s[0], s[1] - 2, C(lt(q[2], .35))); }
}
/** grass / leaf tufts: n little blades inside the rectangle */
export function tufts(x0, x1, y0, y1, z, c, n, seed = 1, hgt = 3) {
  const R = rng(seed * 13 + 5), pts = []; for (let i = 0; i < n; i++) pts.push([x0 + R() * (x1 - x0), y0 + R() * (y1 - y0), R()]);
  pts.sort((a, b) => a[0] + a[1] - b[0] - b[1]); const c1 = C(c), c2 = C(lt(c, .25)), c3 = C(dk(c, .25));
  for (const q of pts) { const s = P(q[0], q[1], z), h = Math.max(1, Math.round(hgt * (.6 + .6 * q[2]))); for (let i = 0; i < h; i++) px(s[0], s[1] - i, i === h - 1 ? c2 : c1); px(s[0] - 1, s[1] - Math.max(0, h - 2), c3); if (q[2] > .5) px(s[0] + 1, s[1] - h + 1, c1); }
}
/** leafy box (hedges, topiary cubes): textured faces + bumpy lit top edge */
export function leafBox(x, y, z, w, d, h, c, o = {}) {
  const f = (base, s) => (u, v) => { const k = hash2(u >> 1, v, s); return k < .2 ? dk(base, .16) : k > .82 ? lt(base, .16) : base; };
  const ft = (wx, wy) => { const k = hash2(Math.floor(wx * 8), Math.floor(wy * 16), 4); return k < .18 ? dk(c, .12) : k > .8 ? lt(c, .2) : c; };
  box(x, y, z, w, d, h, c, { l: f(dk(c, .16), 1), r: f(dk(c, .34), 2), t: ft, ol: o.ol });
  if (o.snow === undefined ? winter() : o.snow) snowTop(x, x + w, y, y + d, z + h, true);
}
/** panel text helper: small lit screen on a +y face */
export function screenY(x0, x1, y, z0, z1, c = '#7fe0d0', c2) { lit(() => qy(x0, x1, y, z0, z1, c, c2)); lw([x0, y, z0], [x1, y, z0], '#2a2f3a'); lw([x0, y, z1], [x1, y, z1], '#2a2f3a'); }
export function screenX(x, y0, y1, z0, z1, c = '#7fe0d0', c2) { lit(() => qx(x, y0, y1, z0, z1, c, c2)); lw([x, y0, z0], [x, y1, z0], '#2a2f3a'); lw([x, y0, z1], [x, y1, z1], '#2a2f3a'); }

/** faceted rock: footprint centre (x,y), radii (rx,ry) world, height h. Seeded irregular facets; moss / snow optional */
export function rock(x, y, z, rx, ry, h, c, seed = 1, o = {}) {
  const R = rng(seed * 53 + 11), N = 8, bot = [], top = [], sh = (R() - .5) * .3;
  for (let i = 0; i < N; i++) { const a = i / N * 6.283 + .3, j = .8 + R() * .34, t = .6 + R() * .28; bot.push([x + Math.cos(a) * rx * j, y + Math.sin(a) * ry * j, z]); top.push([x + Math.cos(a + sh) * rx * j * t, y + Math.sin(a + sh) * ry * j * t, z + h * (.7 + R() * .3)]); }
  const cl = dk(c, .12), cr = dk(c, .4), oc = dk(c, .68), order = [];
  for (let i = 0; i < N; i++) { const a = (i + .5) / N * 6.283 + .3, f = Math.cos(a) + Math.sin(a); if (f > -.35) order.push([f, i, a]); }
  order.sort((p, q) => p[0] - q[0]);
  for (const [, i, a] of order) { const j = (i + 1) % N, k = (Math.cos(a) - Math.sin(a) + 1.4) / 2.8; fillW([bot[i], bot[j], top[j], top[i]], mix(cl, cr, Math.max(0, Math.min(1, k)))); lw(bot[i], bot[j], oc); lw(bot[j], top[j], dk(c, .5)); }
  fillW(top, o.top || (winter() && o.snow !== false ? SNOW : c));
  for (let i = 0; i < N; i++) { const j = (i + 1) % N, a = (i + .5) / N * 6.283 + .3, f = Math.cos(a) + Math.sin(a); lw(top[i], top[j], f > -.2 ? lt(c, .35) : oc); }
  // silhouette sides
  let li = 0, ri = 0; bot.forEach((b, i) => { const s = b[0] - b[1]; if (s < bot[li][0] - bot[li][1]) li = i; if (s > bot[ri][0] - bot[ri][1]) ri = i; });
  lw(bot[li], top[li], oc); lw(bot[ri], top[ri], oc);
  if (o.moss && !winter()) { const s = PW(x, y, z + h * .9); ellipse(s[0] - rx * 4, s[1] + 1, rx * U * .5, ry * U * .22, o.moss, lt(o.moss, .2)); }
}
function fillW(pts, c, c2) { const q = pts.map(p => PW(p[0], p[1], p[2])); fillPoly(q, c, c2); }
/** scanline fill for small (possibly slightly concave) polygons in target pixels */
function fillPoly(p, h, h2) {
  const c = C(h), c2 = h2 ? C(h2) : 0; let y0 = 1e9, y1 = -1e9; for (const q of p) { y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
  for (let y = Math.ceil(y0 - .5); y <= Math.floor(y1 - .5); y++) { const s = y + .5; let l = 1e9, r = -1e9; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; if ((a[1] <= s) !== (b[1] <= s)) { const xx = a[0] + (s - a[1]) / (b[1] - a[1]) * (b[0] - a[0]); l = Math.min(l, xx); r = Math.max(r, xx); } } for (let X = Math.ceil(l - .5); X <= Math.floor(r - .5); X++) px(X, y, c2 && ((X + y) & 1) ? c2 : c); }
}
/** a little pumpkin, rpx = radius in pixels */
export function pumpkin(x, y, z, rpx = 4, c = '#e8822a') {
  const s = P(x, y, z), cy = s[1] - Math.round(rpx * .75), ry = Math.max(2, Math.round(rpx * .8));
  ellipse(s[0], cy, rpx + 1, ry + 1, dk(c, .62)); ellipse(s[0], cy, rpx, ry, c);
  for (let Y = cy - ry + 1; Y <= cy + ry - 1; Y++) { const hw = rpx * Math.sqrt(Math.max(0, 1 - ((Y - cy) / ry) ** 2)); if (hw > 2) { px(s[0] - Math.round(hw * .5), Y, C(lt(c, .3))); px(s[0] + Math.round(hw * .45), Y, C(dk(c, .25))); if (hw > 3) px(s[0] + Math.round(hw * .85), Y, C(dk(c, .35))); } }
  px(s[0], cy - ry - 1, C('#5a7a3a')); px(s[0] + 1, cy - ry - 2, C('#5a7a3a')); if (winter()) { px(s[0] - 1, cy - ry, C(SNOW)); px(s[0] - 2, cy - ry + 1, C(SNOW)); px(s[0] + 1, cy - ry, C(SNOW)); }
}
/** wooden crate with slats (market produce, alley clutter). top: hex or null (open, shows `fillc` contents) */
export function crate(x, y, z, w, d, h, c = '#c9a268', fillc) {
  box(x, y, z, w, d, h, c, { l: (u, v) => v % 4 === 0 ? dk(c, .4) : dk(c, .18), r: (u, v) => v % 4 === 0 ? dk(c, .55) : dk(c, .36), t: fillc || dk(c, .5) });
  if (fillc) { const n = Math.max(2, Math.round(w * d * 22)), R = rng(Math.round(x * 97 + y * 31 + z * 7) + 3); for (let i = 0; i < n; i++) { const s = P(x + .06 + R() * (w - .12), y + .06 + R() * (d - .12), z + h); px(s[0], s[1], C(i % 3 ? lt(fillc, .3) : dk(fillc, .25))); } }
}

/* ---------- street / park construction helpers ---------- */
import { fq, isFlipped, PAT, line } from '../../engine/raster.js';
/** circle outline of rpx pixels around a world point (bike wheels, hoops) */
export function ring(x, y, z, rpx, c, ry) { const s = P(x, y, z), n = Math.max(16, Math.round(rpx * 8)); for (let a = 0; a < n; a++) px(s[0] + Math.round(Math.cos(a / n * 6.283) * rpx), s[1] + Math.round(Math.sin(a / n * 6.283) * (ry || rpx)), C(c)); }
/** cart / truck wheel standing on a y-plane */
export function wheel(x, y, z, r, c = '#2a2f3a', hub = '#9aa0a8') { const s = PW(x, y, z + r); ellipse(s[0], s[1], r * U * .95, r * U, c); ellipse(s[0], s[1], r * U * .45, r * U * .5, hub); }
/** parked bicycle along +x (1.5 long) */
export function bike(x, y, z, c = '#d8342c', o = {}) {
  const r = .3, A = [x + .3, y, z + r], B = [x + 1.2, y, z + r], S = [x + .58, y, z + .78], H = [x + 1.05, y, z + .82], K = [x + .72, y, z + r];
  ring(A[0], y, A[2], 4, '#2a2f3a'); ring(B[0], y, B[2], 4, '#2a2f3a');
  lw(A, S, c); lw(S, H, c); lw(K, H, c); lw(S, K, c); lw(A, K, c); lw(H, B, dk(c, .2)); lw(H, [x + 1.0, y, z + 1.0], '#2a2f3a');
  const s = P(S[0], S[1], S[2]); px(s[0] - 1, s[1] - 1, C('#2a2433')); px(s[0], s[1] - 1, C('#2a2433')); px(s[0] + 1, s[1] - 1, C('#2a2433'));
  const h = P(x + 1.0, y, z + 1.0); px(h[0] - 1, h[1], C('#2a2433')); px(h[0] + 1, h[1] - 1, C('#2a2433'));
  if (o.basket) box(x + 1.1, y - .12, z + .7, .22, .24, .18, '#c9a268', { ol: false });
  if (winter()) { px(s[0], s[1] - 2, C(SNOW)); px(s[0] - 1, s[1] - 2, C(SNOW)); }
}
/** striped sloping awning: back edge (y0, z0) to front edge (y1, z1), stripes along x. o.val = valance height (default .16) */
export function awning(x0, x1, y0, y1, z0, z1, c1, c2, n, o = {}) {
  n = n || Math.max(2, Math.round((x1 - x0) * 2)); const w = (x1 - x0) / n, v = o.val === undefined ? .16 : o.val;
  for (let i = 0; i < n; i++) fq([[x0 + i * w, y0, z0], [x0 + (i + 1) * w, y0, z0], [x0 + (i + 1) * w, y1, z1], [x0 + i * w, y1, z1]], i & 1 ? c2 : c1);
  if (y1 !== y0) fq([[x1, y0, z0], [x1, y1, z1], [x1, y1, z1 - v], [x1, y0, z0 - v * .4]], dk(c1, .35));
  if (v) for (let i = 0; i < n; i++) qy(x0 + i * w, x0 + (i + 1) * w, y1, z1 - v, z1, dk(i & 1 ? c2 : c1, .16));
  const o1 = dk(c1, .6); lw([x0, y1, z1 - v], [x1, y1, z1 - v], o1); lw([x0, y1, z1], [x1, y1, z1], lt(c2, .3)); lw([x0, y0, z0], [x1, y0, z0], o1); lw([x0, y0, z0], [x0, y1, z1], o1); lw([x0, y1, z1], [x0, y1, z1 - v], o1); lw([x1, y0, z0], [x1, y1, z1], o1); lw([x1, y1, z1], [x1, y1, z1 - v], o1);
  if (winter() && o.snow !== false) { qz(x0 + .1, x1 - .1, y0, y0 + (y1 - y0) * .45, z0 + .005, SNOW, 'glass'); fq([[x0 + .15, y0, z0], [x1 - .15, y0, z0], [x1 - .15, y0 + (y1 - y0) * .5, z0 + (z1 - z0) * .5], [x0 + .15, y0 + (y1 - y0) * .5, z0 + (z1 - z0) * .5]], SNOW, 'glass'); fq([[x0 + .15, y0, z0], [x1 - .15, y0, z0], [x1 - .15, y0 + (y1 - y0) * .3, z0 + (z1 - z0) * .3], [x0 + .15, y0 + (y1 - y0) * .3, z0 + (z1 - z0) * .3]], SNOW); }
}
/** parasol on a pole at (x,y): canopy rim radius r at height z. open=false draws it furled */
export function parasol(x, y, z, r, c1, c2, open = true, base = 0) {
  pole(x, y, base, z + r * .4, '#e8e2d4', 1, false);
  if (!open) { const a = P(x, y, z + r * .45), b = P(x, y, z - r * .75); for (let Y = a[1]; Y <= b[1]; Y++) { const hw = Math.round(1 + 1.2 * (Y - a[1]) / Math.max(1, b[1] - a[1])); for (let i = -hw; i <= hw; i++) px(a[0] + i, Y, C(i === -hw || i === hw ? dk(c1, .55) : i < 0 ? c1 : (i & 1 ? c2 : dk(c1, .2)))); } for (let i = -2; i <= 2; i++) px(a[0] + i, Math.round((a[1] + b[1]) / 2) + 2, C(dk(c2, .4))); if (winter()) { px(a[0], a[1] - 1, C(SNOW)); px(a[0] - 1, a[1], C(SNOW)); } return; }
  const ap = [x, y, z + r * .42], seg = [];
  for (let i = 0; i < 8; i++) { const a0 = i * .7854 + .3927, a1 = a0 + .7854, am = a0 + .3927; seg.push({ d: Math.cos(am) + Math.sin(am), k: (Math.cos(am) - Math.sin(am) + 1.42) / 2.84, p: [[x + Math.cos(a0) * r, y + Math.sin(a0) * r, z], [x + Math.cos(a1) * r, y + Math.sin(a1) * r, z]], c: i & 1 ? c2 : c1 }); }
  seg.sort((a, b) => a.d - b.d);
  for (const s of seg) { fq([ap, s.p[0], s.p[1]], dk(s.c, .04 + s.k * .3)); if (s.d > -.3) { fq([s.p[0], s.p[1], [s.p[1][0], s.p[1][1], z - .1], [s.p[0][0], s.p[0][1], z - .1]], dk(s.c, .2 + s.k * .3)); lw([s.p[0][0], s.p[0][1], z - .1], [s.p[1][0], s.p[1][1], z - .1], dk(c1, .62)); } else lw(s.p[0], s.p[1], dk(c1, .62)); }
  const t = P(ap[0], ap[1], ap[2]); px(t[0], t[1] - 1, C('#e8e2d4')); px(t[0], t[1], C(lt(c1, .4)));
}
/** tiny bitmap stamped on a +y wall (rows of '#'/'.'), flip-aware */
export function stampY(rows, x, y, z, c) { const s = P(x, y, z), d = isFlipped() ? -1 : 1, col = C(c); rows.forEach((r, v) => { for (let u = 0; u < r.length; u++) if (r[u] !== '.') px(s[0] + d * u, s[1] + (u >> 1) + v, col); }); }
export const LEAF = ['...#...', '.#.#.#.', '.#####.', '#######', '.#####.', '..###..', '...#...', '...#...'];
/** tiny sitting cat (screen-space, 6px) */
export function cat(x, y, z, c = '#3a3440') { const s = P(x, y, z), k = C(c), d = C(dk(c, .3)); for (const q of [[0, -1], [1, -1], [2, -1], [0, -2], [1, -2], [2, -2], [1, -3], [2, -3], [1, -4], [2, -4], [3, -4], [1, -5], [3, -5]]) px(s[0] + q[0], s[1] + q[1], k); px(s[0] - 1, s[1] - 1, d); px(s[0] - 2, s[1] - 2, d); px(s[0] + 2, s[1] - 4, C('#ffe27a')); }
/** horizontal rail between two world points, w px thick, lit from above */
export function rail(a, b, c, w = 2) { for (let i = 0; i < w; i++) line([PW(a[0], a[1], a[2])[0], PW(a[0], a[1], a[2])[1] + i], [PW(b[0], b[1], b[2])[0], PW(b[0], b[1], b[2])[1] + i], i === 0 ? lt(c, .25) : i === w - 1 && w > 2 ? dk(c, .3) : c); }
/** bicycle parked along +y (nose toward -y), frame colour c */
export function bikeY(x, y0, z, c = '#d8342c') {
  const r = .3, A = [x, y0 + .3, z + r], B = [x, y0 + 1.2, z + r], S = [x, y0 + .95, z + .78], H = [x, y0 + .45, z + .85], K = [x, y0 + .8, z + r];
  ring(x, y0 + .3, z + r, 4, '#2a2f3a'); ring(x, y0 + 1.2, z + r, 4, '#2a2f3a');
  lw(B, S, c); lw(S, H, c); lw(K, H, c); lw(S, K, c); lw(B, K, c); lw(H, A, dk(c, .2)); lw(H, [x, y0 + .5, z + 1.02], '#2a2f3a');
  const s = P(S[0], S[1], S[2]); px(s[0] - 1, s[1] - 1, C('#2a2433')); px(s[0], s[1] - 1, C('#2a2433')); px(s[0] + 1, s[1] - 2, C(winter() ? SNOW : '#2a2433'));
}
/** faceted (octagonal) cone roof: rim radius r at height z, apex h above. Snowy in winter */
export function octRoof(x, y, z, r, h, c1, c2, o = {}) {
  const ap = [x, y, z + h], seg = [], n = o.n || 8, st = 6.2832 / n, w = winter() && o.snow !== false;
  for (let i = 0; i < n; i++) { const a0 = i * st + st / 2, a1 = a0 + st, am = a0 + st / 2; seg.push({ d: Math.cos(am) + Math.sin(am), k: (Math.cos(am) - Math.sin(am) + 1.42) / 2.84, p: [[x + Math.cos(a0) * r, y + Math.sin(a0) * r, z], [x + Math.cos(a1) * r, y + Math.sin(a1) * r, z]], c: i & 1 ? c2 : c1 }); }
  seg.sort((a, b) => a.d - b.d);
  for (const s of seg) {
    fq([ap, s.p[0], s.p[1]], dk(s.c, .04 + s.k * .32));
    if (w) { const m = (q, t) => [x + (q[0] - x) * t, y + (q[1] - y) * t, z + h * (1 - t)]; fq([ap, m(s.p[0], .62), m(s.p[1], .62)], s.k > .6 ? SNOW2 : SNOW); fq([m(s.p[0], .62), m(s.p[1], .62), m(s.p[1], .8), m(s.p[0], .8)], s.k > .6 ? SNOW2 : SNOW, 'glass'); }
    lw(ap, s.p[1], dk(s.c, .45)); if (s.d > -.3) { const e = o.eave === undefined ? .12 : o.eave; fq([s.p[0], s.p[1], [s.p[1][0], s.p[1][1], z - e], [s.p[0][0], s.p[0][1], z - e]], dk(s.c, .25 + s.k * .3)); lw([s.p[0][0], s.p[0][1], z - e], [s.p[1][0], s.p[1][1], z - e], dk(c1, .65)); lw(s.p[0], s.p[1], lt(s.c, .25)); } else lw(s.p[0], s.p[1], dk(c1, .65));
  }
}
/** small rowboat along +x, hull colour c */
export function rowboat(x, y, z, len, c, o = {}) {
  const h = .32, b = [x + len, y + .5, z + h + .06], w = '#c9a268';
  fq([[x, y + .15, z + h], [x + len * .78, y + .15, z + h], b, [x + len * .78, y + .85, z + h], [x, y + .85, z + h]], o.cover || dk(w, .3));
  fq([[x, y + .85, z + h], [x + len * .78, y + .85, z + h], b, [x + len * .86, y + .55, z], [x + .12, y + .72, z]], c);
  fq([[x, y + .85, z + h - .1], [x + len * .78, y + .85, z + h - .1], b, [x + len * .78, y + .85, z + h], [x, y + .85, z + h]], lt(c, .35));
  lw([x, y + .85, z + h], [x + len * .78, y + .85, z + h], lt(c, .5)); lw([x + len * .78, y + .85, z + h], b, lt(c, .5)); lw([x, y + .15, z + h], [x + len * .78, y + .15, z + h], dk(c, .3)); lw([x + len * .78, y + .15, z + h], b, dk(c, .3)); lw([x, y + .15, z + h], [x, y + .85, z + h], dk(c, .5));
  lw([x + .12, y + .72, z], [x + len * .86, y + .55, z], dk(c, .65)); lw([x + len * .86, y + .55, z], b, dk(c, .65)); lw([x, y + .85, z + h], [x + .12, y + .72, z], dk(c, .65));
  if (!o.cover) for (const t of [.3, .6]) { fq([[x + len * t, y + .17, z + h - .02], [x + len * t + .16, y + .17, z + h - .02], [x + len * t + .16, y + .83, z + h - .02], [x + len * t, y + .83, z + h - .02]], w); }
  if (winter()) fq([[x + .1, y + .22, z + h + .01], [x + len * .7, y + .22, z + h + .01], [x + len * .7, y + .5, z + h + .01], [x + .1, y + .5, z + h + .01]], SNOW, 'glass');
}
