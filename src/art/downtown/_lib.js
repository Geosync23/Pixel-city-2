// Downtown kit: shared helpers (facades, curtain walls, rooftop clutter, street-level bits). Local to src/art/downtown.
import { U, ENV, C, dk, lt, mix, rng, hash2, PW, px, fill, line, ellipse, fq, lw, qy, qx, qz, box, cyl, ball, cone, glow, lit, winY, winX, signY, signX, textW, foliage, grassC, isFlipped, PAT } from '../../engine/raster.js';

export const FH = 1.75;               // tower storey (slightly squat so 16 floors stay under ~620 px)
export const SNOW = '#f4f8fb', SNOW2 = '#dde7f0';
export const winter = () => ENV.season === 3;
export const GLOWC = { warm: ['#ffd98a', '#f4c870'], cool: ['#e2f2ff', '#c4e2f6'], amber: ['#ffc56a', '#f0ac50'], tv: ['#a8d8ff', '#8ec2f2'], pink: ['#ffb0d0', '#f590b8'] };
/** clamp a tower's floor count so the sprite stays under ~620 px: extra = units above the roof (crown, mast) */
export const capFloors = (fl, w, d, extra = 0, fh = FH, base = 0) => Math.max(3, Math.min(fl, Math.floor(((620 - (w + d) * 8) / 16 - extra - base) / fh)));

/* ---------- window-light planner: whole floors on/off + random cells, warm/cool mix ---------- */
export function lights(seed, dens = .42) {
  const r = rng((seed | 0) * 7 + 13), fm = [];
  const fl = f => fm[f] || (fm[f] = { m: (k => k < .1 ? 2 : k < .26 ? 0 : 1)(r()), c: (k => k < .62 ? GLOWC.warm : k < .88 ? GLOWC.cool : GLOWC.amber)(r()) });
  return { r, col: f => fl(f).c, on: f => r() < [.05, dens, .94][fl(f).m] };
}

/* ---------- face abstraction: write facade code once for the +y or the +x wall ---------- */
export function face(f, c) {
  const xf = f === 'x';
  return {
    xf, c,
    P: (u, o, z) => xf ? [c + o, u, z] : [u, c + o, z],
    q: (u0, u1, z0, z1, h, h2, o = 0) => xf ? qx(c + o, u0, u1, z0, z1, h, h2) : qy(u0, u1, c + o, z0, z1, h, h2),
    l: (u0, z0, u1, z1, h, o = 0) => xf ? lw([c + o, u0, z0], [c + o, u1, z1], h) : lw([u0, c + o, z0], [u1, c + o, z1], h),
    win: (u0, u1, z0, z1, o) => xf ? winX(c, u0, u1, z0, z1, o) : winY(u0, u1, c, z0, z1, o),
    sign: (s, u0, u1, z0, z1, bg, fg, o, off = .02) => xf ? signX(s, c + off, u0, u1, z0, z1, bg, fg, o) : signY(s, u0, u1, c + off, z0, z1, bg, fg, o),
    box: (u, o, z, lu, lo, h, col, opt) => xf ? box(c + o, u, z, lo, lu, h, col, opt) : box(u, c + o, z, lu, lo, h, col, opt),
    sh: col => xf ? dk(col, .16) : col,
  };
}
export const FY = d => face('y', d), FX = w => face('x', w);

/* ---------- glass curtain wall ---------- */
/**
 * Curtain wall on face F spanning u a0..a1, z0..z1.
 * o: { L: lights(), glass, fh, bay, sp: spandrel colour|null, sph: spandrel height, mull, f0: floor index offset for L, ph: streak phase,
 *      hm: horizontal mid mullion, fin: every n bays draw a pale fin, tint2: alternate glass colour for banding fn(f,i) }
 */
export function curtain(F, a0, a1, z0, z1, o = {}) {
  const fh = o.fh || FH, g = o.glass || '#5fa3c4', L = o.L, bay = o.bay || .75, sp = o.sp === undefined ? dk(g, .32) : o.sp, sph = o.sph === undefined ? .4 : o.sph, mull = o.mull || dk(g, .5);
  const n = Math.max(1, Math.round((a1 - a0) / bay)), bw = (a1 - a0) / n, nf = Math.max(1, Math.round((z1 - z0) / fh)), fhh = (z1 - z0) / nf, ph = o.ph || 0, f0 = o.f0 || 0, det = o.detail === undefined ? 4 : o.detail;
  F.q(a0, a1, z0, z1, F.sh(g));
  for (let f = 0; f < nf; f++) {
    const zb = z0 + f * fhh, zg = zb + (sp ? sph : 0), zt = zb + fhh;
    if (sp) F.q(a0, a1, zb, zg, F.sh(sp));
    for (let i = 0; i < n; i++) {
      const si = F.xf ? n - 1 - i + 40 : i, u0 = a0 + i * bw, u1 = u0 + bw, k = hash2(si, f + f0, ph + 3);
      const st = ((si * 2 - (f + f0) * 3 + ph * 5) % 23 + 23) % 23;
      let c = o.tint ? o.tint(f + f0, si) : g;
      c = st < 4 ? lt(c, .2) : st < 6 ? lt(c, .09) : k < .13 ? dk(c, .1) : k > .9 ? lt(c, .08) : c;
      if (c !== g) F.q(u0, u1, zg, zt, F.sh(c));
      F.q(u0, u1, zt - .1, zt, F.sh(dk(c, .14)));
      const on = L && L.on(f + f0);
      if (on) { const gc = L.col(f + f0), bl = L.r() < .22; glow(() => { F.q(u0, u1, bl ? zg + (zt - zg) * .45 : zg, zt, F.xf ? gc[1] : gc[0], F.xf ? dk(gc[1], .08) : gc[1]); if (!bl) F.q(u0 + bw * .2, u1 - bw * .2, zt - .16, zt - .08, '#fffbe8'); }); if (bl) F.q(u0, u1, zg + (zt - zg) * .45, zg + (zt - zg) * .45 + .07, F.sh(lt(c, .3))); }
      if (f + f0 < det && bw >= .45) mini(F, u0, u1, zg, zt, hash2(si, f + f0, ph + 11), on, c);
    }
    if (o.hm) F.l(a0, (zg + zt) / 2, a1, (zg + zt) / 2, F.sh(mull));
    F.l(a0, zb, a1, zb, F.sh(dk(mull, .15)));
    if (sp) F.l(a0, zg, a1, zg, F.sh(lt(sp, .25)));
  }
  for (let i = 1; i < n; i++) { const u = a0 + i * bw, fin = o.fin && i % o.fin === 0; F.l(u, z0, u, z1, F.sh(fin ? o.finc || '#e8eef2' : mull)); }
}
/** both visible faces of a glass box (x,y,w,d) from z0 to z1 */
export function curtainBox(x, y, w, d, z0, z1, o) { curtain(FX(x + w), y, y + d, z0, z1, Object.assign({}, o, { ph: (o.ph || 0) + 2 })); curtain(FY(y + d), x, x + w, z0, z1, o); }

/** grid of punched windows on face F. o: { L, fh, ww, wh, sill: z offset in floor, pitch, mullion, frame, glass, m: side margin, f0, opts } */
export function winGrid(F, a0, a1, z0, floors, o = {}) {
  const fh = o.fh || 2, ww = o.ww || .8, wh = o.wh || 1.1, zo = o.zo === undefined ? .5 : o.zo, m = o.m === undefined ? .45 : o.m, pitch = o.pitch || ww + .6, L = o.L;
  const n = Math.max(1, Math.floor((a1 - a0 - 2 * m + (pitch - ww)) / pitch)), st = (a1 - a0 - 2 * m - ww) / Math.max(1, n - 1), f0 = o.f0 || 0;
  for (let f = 0; f < floors; f++) for (let i = 0; i < n; i++) {
    const u0 = n === 1 ? (a0 + a1 - ww) / 2 : a0 + m + i * st, z = z0 + f * fh + zo;
    if (o.skip && o.skip(f, i, n)) continue;
    const on = L ? L.on(f + f0) : false;
    F.win(u0, u0 + ww, z, z + wh, Object.assign({ on, mullion: o.mullion, sill: o.sill !== false, frame: o.frame, glass: o.glass && (F.xf ? o.glass.map(c => dk(c, .14)) : o.glass), glowc: L ? (F.xf ? L.col(f + f0).map(c => dk(c, .06)) : L.col(f + f0)) : undefined }, o.opts));
    if (o.each) o.each(u0, z, f, i, on);
  }
}

/* ---------- big pixel font (scaled 3x5) ---------- */
const FONT = { A: '25755', B: '65656', C: '34443', D: '65556', E: '74647', F: '74644', G: '34553', H: '55755', I: '72227', J: '11152', K: '55655', L: '44447', M: '57555', N: '65555', O: '25552', P: '65644', Q: '25563', R: '65655', S: '34216', T: '72222', U: '55557', V: '55552', W: '55575', X: '55255', Y: '55222', Z: '71247', 0: '75557', 1: '26227', 2: '61247', 3: '61216', 4: '55711', 5: '74616', 6: '34757', 7: '71222', 8: '75757', 9: '75716', ' ': '00000', '.': '00002', '!': '22202', '-': '00700', '+': '02720', "'": '22000', '&': '25256', '*': '05250', '$': '37276', '%': '51245', ':': '02020', '/': '11244' };
export const bigW = (s, sc = 2) => (String(s).length * 4 - 1) * sc;
/** scaled text painted on face F; (u,z) = top-left corner on the wall (for the x face u is the HIGH y end, text reads toward -y). */
export function bigText(F, str, u, z, hex, sc = 2, off = .02) {
  str = String(str).toUpperCase(); const W = bigW(str, sc) / U, fl = isFlipped(); let skew = F.xf ? -1 : 1, s;
  if (fl) { skew = -skew; s = F.xf ? PW(F.c + off, u - W, z) : PW(u + W, F.c + off, z); } else s = PW(...F.P(u, off, z));
  const X = Math.round(s[0]), Y = Math.round(s[1]), c = C(hex);
  for (let i = 0; i < str.length; i++) { const g = FONT[str[i]] || FONT['-']; for (let r = 0; r < 5; r++) for (let b = 0; b < 3; b++) if (+g[r] & (4 >> b)) for (let a = 0; a < sc; a++) for (let e = 0; e < sc; e++) { const dx = (i * 4 + b) * sc + a; px(X + dx, Y + skew * (dx >> 1) + r * sc + e, c); } }
}
/** board with centred big text on face F. o: { sc, lit, frame:false, off } */
export function bigSign(F, str, u0, u1, z0, z1, bg, fg, o = {}) {
  const sc = o.sc || 2, off = o.off === undefined ? .02 : o.off, W = bigW(str, sc) / U, mid = (u0 + u1) / 2, zt = (z0 + z1) / 2 + 2.5 * sc / U + (F.xf ? 0 : 0);
  const d = () => { if (bg) F.q(u0, u1, z0, z1, bg, undefined, off); bigText(F, str, F.xf ? mid + W / 2 : mid - W / 2, zt, fg, sc, off); };
  if (o.lit) lit(d); else d();
  if (bg && o.frame !== false) { const f = dk(bg, .5); F.l(u0, z0, u1, z0, f, off); F.l(u0, z1, u1, z1, f, off); F.l(u0, z0, u0, z1, f, off); F.l(u1, z0, u1, z1, f, off); }
}

/* ---------- discs & domes ---------- */
/** circle painted on a wall (skewed with the wall). centre u,z radius r (world) */
export function disc(F, u, z, r, hex, off = .02) { F.q(u - r, u + r, z - r, z + r, (a, b, w, h) => { const dx = a + .5 - w / 2, dy = b + .5 - h / 2; return dx * dx + dy * dy <= w * w / 4 ? hex : null; }, undefined, off); }
/** clock face on a wall: lit dial + hands */
export function clock(F, u, z, r, o = {}) {
  disc(F, u, z, r + .09, o.rim || '#3a3440'); lit(() => disc(F, u, z, r, o.dial || '#fff4d0'));
  F.l(u, z, u, z + r * .75, '#2a2430', .03); F.l(u, z, u + (F.xf ? -1 : 1) * r * .5, z + r * .2, '#b03030', .03);
}
/** dome: base centre (x,y,z), radius r, height hgt (world). ribs: number of rib lines */
export function dome(x, y, z, r, hgt, c, o = {}) {
  const b = PW(x, y, z), rx = r * U * 1.414, ry = rx / 2, H = hgt * U, cT = C(lt(c, .28)), cM = C(c), cD = C(dk(c, .22)), cDD = C(dk(c, .4)), oc = C(dk(c, .7)), fl = isFlipped() ? -1 : 1;
  for (let X = Math.ceil(b[0] - rx); X <= Math.floor(b[0] + rx); X++) {
    const k = (X - b[0]) / rx, e = Math.sqrt(Math.max(0, 1 - k * k)), yt = Math.round(b[1] - H * e - ry * e * .3), yb = Math.round(b[1] + ry * e);
    for (let Y = yt; Y <= yb; Y++) { const v = (Y - yt) / Math.max(1, yb - yt), li = -k * fl * .7 - v * .9 + (((X + Y) & 1) ? .08 : -.08) + .45; px(X, Y, li > .55 ? cT : li > -.05 ? cM : li > -.55 ? cD : cDD); }
    px(X, yt - 1, oc); px(X, yb + 1, oc);
  }
  const n = o.ribs || 0; for (let i = 1; i < n; i++) { const a = -1 + 2 * i / n; let pv = null; for (let t = 0; t <= 1.001; t += .05) { const e = Math.sqrt(Math.max(0, 1 - t * t)), X = b[0] + a * rx * e * 1, Y = b[1] - H * t - ry * .3 * t + ry * e * (1 - Math.abs(a)) * .9; if (pv) line(pv, [X, Y], dk(c, .3)); pv = [X, Y]; } }
}

/* ---------- extruded convex footprints (rounded towers, drums) ---------- */
export const rrect = (x0, y0, x1, y1, r) => (x, y) => { if (x < x0 || x > x1 || y < y0 || y > y1) return false; const cx = x < x0 + r ? x0 + r : x > x1 - r ? x1 - r : x, cy = y < y0 + r ? y0 + r : y > y1 - r ? y1 - r : y; return (x - cx) ** 2 + (y - cy) ** 2 <= r * r; };
export const circ = (cx, cy, r) => (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
/**
 * Extrude a convex footprint inside(x,y) within bb=[x0,y0,x1,y1] from z0 to z1.
 * wall(u, v, k) -> hex : u px along the visible perimeter, v px above base, k facing 0 (+y) .. 1 (+x).   top: hex.
 * o.glowf(u,v,k) -> hex|null : night light.  o.ol: outline colour.
 */
export function extrude(inside, bb, z0, z1, wall, top, o = {}) {
  const smin = bb[0] - bb[3], smax = bb[2] - bb[1], N = Math.round((smax - smin) * U), tmin = bb[0] + bb[1], tmax = bb[2] + bb[3], cols = [], fl = isFlipped();
  for (let k = 0; k < N; k++) {
    const s = smin + (k + .5) / U, at = t => inside((t + s) / 2, (t - s) / 2); let ti = null;
    for (let j = 0; j <= 40; j++) { const t = tmin + (tmax - tmin) * j / 40; if (at(t)) { ti = t; break; } }
    if (ti === null) continue;
    let lo = ti, hi = tmax + .01; for (let j = 0; j < 22; j++) { const m = (lo + hi) / 2; if (at(m)) lo = m; else hi = m; }
    let lo2 = tmin - .01, hi2 = ti; for (let j = 0; j < 22; j++) { const m = (lo2 + hi2) / 2; if (at(m)) hi2 = m; else lo2 = m; }
    cols.push({ xf: (lo + s) / 2, yf: (lo - s) / 2, xb: (hi2 + s) / 2, yb: (hi2 - s) / 2 });
  }
  if (!cols.length) return;
  let u = 0; const Hp = Math.round((z1 - z0) * U), oc = C(o.ol || dk(typeof top === 'string' ? top : '#808080', .7)), tc = C(top), hl = C(lt(top, .45)), lit_ = [];
  cols.forEach((c, i) => {
    const a = cols[Math.max(0, i - 1)], b = cols[Math.min(cols.length - 1, i + 1)], dx = b.xf - a.xf, dy = b.yf - a.yf;
    let k = Math.max(0, Math.min(1, Math.atan2(-dy, dx) / (Math.PI / 2))); if (fl) k = 1 - k;
    if (i) u += Math.hypot(c.xf - cols[i - 1].xf, c.yf - cols[i - 1].yf) * U;
    c.k = k; c.u = u;
  });
  const UT = u;
  cols.forEach((c, i) => {
    const p = PW(c.xf, c.yf, z0), X = Math.floor(p[0]), Yb = Math.round(p[1]), pb = PW(c.xb, c.yb, z1), Ybk = Math.round(pb[1]), uu = fl ? UT - c.u : c.u;
    for (let Y = Ybk; Y < Yb - Hp; Y++) px(X, Y, tc);
    px(X, Ybk - 1, oc);
    for (let v = 0; v < Hp; v++) { const h = wall(uu, v, c.k); if (h) px(X, Yb - 1 - v, C(h)); if (o.glowf) { const g = o.glowf(uu, v, c.k); if (g) lit_.push(X, Yb - 1 - v, C(g)); } }
    px(X, Yb - Hp, hl); px(X, Yb, oc);
    if (i === 0 || i === cols.length - 1) { const X2 = X + (i ? 1 : -1) * (fl ? -1 : 1); for (let Y = Ybk; Y <= Yb; Y++) px(X2, Y, oc); }
  });
  if (lit_.length) glow(() => { for (let i = 0; i < lit_.length; i += 3) px(lit_[i], lit_[i + 1], lit_[i + 2]); });
}
/** wall shader + glow shader for a glass curtain wall on an extruded shape */
export function glassShader(o = {}) {
  const g = o.glass || '#5fa3c4', fh = Math.round((o.fh || FH) * U), bay = Math.round((o.bay || .75) * U), sp = o.sp === undefined ? dk(g, .32) : o.sp, sph = Math.round((o.sph === undefined ? .4 : o.sph) * U), L = o.L, mull = o.mull || dk(g, .5), on = new Map(), f0 = o.f0 || 0;
  const sh = (c, k) => k < .25 ? c : k < .5 ? dk(c, .06) : k < .75 ? dk(c, .11) : dk(c, .17);
  const cell = (fi, bi) => { const key = fi * 1000 + bi; let v = on.get(key); if (v === undefined) { v = L && L.on(fi + f0) ? (L.r() < .22 ? 2 : 1) : 0; on.set(key, v); } return v; };
  return {
    wall: (u, v, k) => { const fi = Math.floor(v / fh), vv = v - fi * fh, bi = Math.floor(u / bay), uu = Math.floor(u) - bi * bay; if (vv === 0) return sh(dk(mull, .15), k); if (sp && vv < sph) return sh(sp, k); if (uu === 0) return sh(mull, k); const st = ((bi * 2 - (fi + f0) * 3) % 23 + 23) % 23, h = hash2(bi, fi + f0, 5); const c = o.tint ? o.tint(fi + f0, bi) : g; return sh(st < 4 ? lt(c, .2) : st < 6 ? lt(c, .09) : h < .13 ? dk(c, .1) : h > .9 ? lt(c, .08) : c, k); },
    glowf: (u, v, k) => { const fi = Math.floor(v / fh), vv = v - fi * fh, bi = Math.floor(u / bay), uu = Math.floor(u) - bi * bay; if (vv === 0 || (sp ? vv < sph : false) || uu === 0) return null; const c = cell(fi, bi); if (!c || (c === 2 && vv < sph + (fh - sph) * .45)) return null; const gc = L.col(fi + f0); return k < .5 ? gc[0] : gc[1]; },
  };
}

/* ---------- roofs ---------- */
export function snowTop(x0, x1, y0, y1, z, solid) {
  if (!winter()) return;
  if (x1 - x0 < .5 || y1 - y0 < .5 || solid) { qz(x0, x1, y0, y1, z, SNOW); return; }
  qz(x0, x1, y0, y1, z, SNOW, 'glass'); qz(x0 + .15, x1 - .15, y0 + .15, y1 - .15, z, SNOW);
  const r = rng(Math.round(x0 * 31 + y0 * 17 + z * 7 + x1 * 3) + 5);
  for (let i = 0; i < (x1 - x0) * (y1 - y0) / 6; i++) { const a = x0 + .3 + r() * (x1 - x0 - 1.4), b = y0 + .3 + r() * (y1 - y0 - 1.2); if (a > x0 && b > y0) qz(a, a + .5 + r() * .5, b, b + .3 + r() * .3, z, SNOW2); }
}
/** sunken roof deck inside a parapet (box top already drawn in the parapet colour c) + winter snow */
export function roofTop(x, y, z, w, d, c, o = {}) {
  const m = o.m === undefined ? .2 : o.m, rc = o.rc || dk(c, .25);
  qz(x + m, x + w - m, y + m, y + d - m, z, rc, o.rc2);
  lw([x + m, y + m, z], [x + w - m, y + m, z], dk(rc, .35)); lw([x + m, y + m, z], [x + m, y + d - m, z], dk(rc, .35));
  lw([x + w - m, y + m, z], [x + w - m, y + d - m, z], lt(rc, .12)); lw([x + m, y + d - m, z], [x + w - m, y + d - m, z], lt(rc, .12));
  snowTop(x + m, x + w - m, y + m, y + d - m, z);
}
export function ac(x, y, z, s = 1) {
  const w = 1.1 * s, d = .9 * s, h = .55 * s; box(x, y, z, w, d, h, '#b9bfc6');
  for (let k = .12; k < h - .08; k += .12) lw([x + .1, y + d, z + k], [x + w - .1, y + d, z + k], '#868d98');
  const p = PW(x + w / 2, y + d / 2, z + h); ellipse(p[0], p[1], 6 * s, 3 * s, '#6d7480'); ellipse(p[0], p[1], 4 * s, 2 * s, '#4c525e'); px(p[0], p[1], C('#b9bfc6'));
  if (winter()) qz(x, x + w, y, y + d * .45, z + h, SNOW, 'glass');
}
export function vent(x, y, z, h = .45) { cyl(x, y, z, .16, h, '#a2a8b0'); cyl(x, y, z + h, .24, .1, '#7d838e'); }
export function hut(x, y, z, w = 1.6, d = 1.4, h = 1.5, c = '#c9c4b8') {
  box(x, y, z, w, d, h, c); qy(x + w * .5 - .3, x + w * .5 + .3, y + d, z, z + 1.15, '#4a5560'); lw([x + w * .5 - .3, y + d, z + 1.15], [x + w * .5 + .3, y + d, z + 1.15], '#2e3640');
  glow(() => { const p = PW(x + w * .5, y + d, z + 1.32); px(p[0], p[1], C('#fff2c4')); px(p[0] + 1, p[1], C('#fff2c4')); px(p[0], p[1] + 1, C('#ffd98a')); });
  snowTop(x + .1, x + w - .1, y + .1, y + d - .1, z + h);
}
export function tank(x, y, z, r = .65, c = '#9a6f4a') {
  for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) lw([x + a * r * .65, y + b * r * .65, z], [x + a * r * .65, y + b * r * .65, z + .7], '#4a4048');
  lw([x - r * .65, y + r * .65, z], [x + r * .65, y + r * .65, z + .6], '#4a4048');
  cyl(x, y, z + .6, r, 1.25, c); const b = PW(x, y, z + .6), rx = r * U * 1.414;
  for (const zz of [.3, .8]) for (let X = Math.ceil(b[0] - rx); X <= Math.floor(b[0] + rx); X++) { const k = (X - b[0]) / rx; px(X, Math.round(b[1] - zz * U + rx / 2 * Math.sqrt(Math.max(0, 1 - k * k))), C(dk(c, .5))); }
  for (let X = Math.ceil(b[0] - rx) + 3; X <= Math.floor(b[0] + rx); X += 4) { const k = (X - b[0]) / rx, e = rx / 2 * Math.sqrt(Math.max(0, 1 - k * k)); for (let Y = b[1] - 1.25 * U + e; Y < b[1] + e; Y += 2) px(X, Y, C(dk(c, k > .15 ? .5 : .32))); }
  cone(x, y, z + 1.85, r * 1.08, .55, winter() ? SNOW : '#6a5a52');
}
export function dish(x, y, z, s = 1) {
  lw([x, y, z], [x, y, z + .45 * s], '#5a606c'); const p = PW(x, y, z + .6 * s), f = isFlipped() ? -1 : 1;
  ellipse(p[0], p[1], 7 * s, 5 * s, '#5a606c'); ellipse(p[0] - f, p[1] - 1, 6 * s, 4 * s, '#e4e8ec'); ellipse(p[0] - f * 2, p[1], 3.4 * s, 2.4 * s, '#c2c8d0'); line([p[0] - f * 2, p[1]], [p[0] - f * 6 * s, p[1] - 5 * s], '#4a4f5a');
}
/** mast with red aviation beacon(s) */
export function antenna(x, y, z, h, o = {}) {
  const c = o.c || '#6a707c';
  if (h > 2.5) { box(x - .07, y - .07, z, .14, .14, h * .55, c, { ol: false }); lw([x, y, z + h * .55], [x, y, z + h], c); for (const k of [.3, .55, .75]) { lw([x - .25, y, z + h * k], [x + .25, y, z + h * k], c); lw([x, y - .25, z + h * k], [x, y + .25, z + h * k], c); } }
  else { lw([x, y, z], [x, y, z + h], c); lw([x - .15, y, z + h * .7], [x + .15, y, z + h * .7], c); }
  beacon(x, y, z + h); if (h > 4) beacon(x, y, z + h * .55, 1);
}
export function beacon(x, y, z, small, col = '#ff4040') {
  const p = PW(x, y, z), X = Math.round(p[0]), Y = Math.round(p[1]);
  glow(() => { const g = C(dk(col, .45)); for (const [a, b] of small ? [[-1, 0], [1, 0], [0, -1], [0, 1]] : [[-2, 0], [2, 0], [0, -2], [0, 2], [-1, -1], [1, -1], [-1, 1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]) px(X + a, Y + b, g); });
  lit(() => { px(X, Y, C(col)); if (!small) { px(X, Y - 1, C(col)); px(X, Y + 1, C(lt(col, .3))); } });
}
export function helipad(cx, cy, z, r = 1.6, o = {}) {
  cyl(cx, cy, z, r + .15, .25, '#7a808c'); const p = PW(cx, cy, z + .25), rx = r * U * 1.414;
  ellipse(p[0], p[1], rx, rx / 2, o.c || '#4f5662'); ellipse(p[0], p[1], rx * .86, rx * .43, '#f2c230'); ellipse(p[0], p[1], rx * .76, rx * .38, o.c || '#4f5662');
  const b = r * .32, t = r * .1, zz = z + .25;
  if (winter()) ellipse(p[0], p[1], rx * .76, rx * .38, SNOW, 'glass');
  qz(cx - b - t, cx - b + t, cy - b * 1.2, cy + b * 1.2, zz, '#f4f0e8'); qz(cx + b - t, cx + b + t, cy - b * 1.2, cy + b * 1.2, zz, '#f4f0e8'); qz(cx - b, cx + b, cy - t, cy + t, zz, '#f4f0e8');
  for (const [a, e] of [[1, 0], [-1, 0], [0, 1], [0, -1], [.7, .7], [-.7, .7], [.7, -.7], [-.7, -.7]]) { const q = PW(cx + a * r, cy + e * r, zz); lit(() => px(q[0], q[1], C('#7dffb0'))); }
}
/** roof garden bed with bushes / small trees / bench */
export function garden(x0, x1, y0, y1, z, r, o = {}) {
  const g = grassC(); box(x0, y0, z, x1 - x0, y1 - y0, .22, '#b9ae9c', { t: g[0], t2: g[1] });
  const pts = []; const n = Math.max(2, Math.round((x1 - x0) * (y1 - y0) / 2.2));
  for (let i = 0; i < n; i++) pts.push([x0 + .4 + r() * (x1 - x0 - .8), y0 + .4 + r() * (y1 - y0 - .8), r(), r()]);
  pts.sort((a, b) => a[0] + a[1] - b[0] - b[1]);
  for (const [x, y, k, v] of pts) {
    const f = foliage(k < .25 ? 'pine' : k < .4 ? 'blossom' : 'leaf', v) || '#8a7a70';
    if (k > .72 && !o.low) { lw([x, y, z + .22], [x, y, z + 1], '#6b4a2f'); if (winter() && k >= .25) { lw([x, y, z + 1], [x - .3, y, z + 1.5], '#6b4a2f'); lw([x, y, z + 1], [x + .3, y, z + 1.6], '#6b4a2f'); ball(x, y, z + 1.45, .3, SNOW, { ol: false }); } else ball(x, y, z + 1.3, .5, f); }
    else if (winter()) ball(x, y, z + .4, .3, SNOW2, { t: SNOW, squash: .7 });
    else { ball(x, y, z + .42, .32, f, { squash: .75 }); if (k > .4 && ENV.season < 2) { const p = PW(x, y, z + .55); px(p[0] - 1, p[1], C(['#ff7a9a', '#ffd84a', '#f4f0ff'][Math.floor(v * 3)])); px(p[0] + 2, p[1] + 1, C(['#ff7a9a', '#ffd84a', '#f4f0ff'][Math.floor(v * 3)])); } }
  }
}
export function solar(x, y, z, n = 3) { for (let i = 0; i < n; i++) { const a = x + i * .75; fq([[a, y, z + .45], [a + .6, y, z + .45], [a + .6, y + 1, z + .1], [a, y + 1, z + .1]], winter() ? SNOW2 : '#2f4f8f', winter() ? '#2f4f8f' : '#3c64ad'); lw([a, y + 1, z + .1], [a + .6, y + 1, z + .1], '#1f2a4a'); lw([a + .6, y, z + .45], [a + .6, y + 1, z + .1], '#8fa8d8'); } }
export function skylight(x, y, z, w = 1.6, d = 1.2) { box(x, y, z, w, d, .2, '#8a909c'); qz(x + .1, x + w - .1, y + .1, y + d - .1, z + .2, '#8fd0e0', '#a8e0ea'); glow(() => qz(x + .1, x + w - .1, y + .1, y + d - .1, z + .2, '#ffe9b0', '#ffd98a')); lw([x + w / 2, y + .1, z + .2], [x + w / 2, y + d - .1, z + .2], '#6a707c'); }
/** billboard on face F direction, standing on a roof at z. spans u0..u1. lines: array of strings */
export function billboard(F, u0, u1, z, hgt, lines, bg, fg, o = {}) {
  const leg = o.leg === undefined ? .7 : o.leg, sc = o.sc || 1, th = .18;
  for (const u of [u0 + .3, u1 - .3, (u0 + u1) / 2]) { lw(F.P(u, 0, z), F.P(u, 0, z + leg), '#3a3f4a'); lw(F.P(u, -.6, z), F.P(u, -th, z + leg + hgt * .6), '#3a3f4a'); }
  F.box(u0, -th, z + leg, u1 - u0, th, hgt, '#3d4350');
  lit(() => { F.q(u0 + .1, u1 - .1, z + leg + .1, z + leg + hgt - .1, bg, o.bg2, .01); if (o.stripe) F.q(u0 + .1, u1 - .1, z + leg + .1, z + leg + .28, o.stripe, undefined, .01); });
  const n = lines.length, lh = (5 * sc + 3) / U, top = z + leg + hgt / 2 + n * lh / 2 - 1.5 / U;
  lit(() => lines.forEach((s, i) => { const W = bigW(s, sc) / U, mid = (u0 + u1) / 2; bigText(F, s, F.xf ? mid + W / 2 : mid - W / 2, top - i * lh, Array.isArray(fg) ? fg[i % fg.length] : fg, sc, .02); }));
  for (let u = u0 + .4; u < u1 - .2; u += 1) { lw(F.P(u, 0, z + leg + hgt), F.P(u, .3, z + leg + hgt + .12), '#3a3f4a'); glow(() => { const p = PW(...F.P(u, .3, z + leg + hgt + .1)); px(p[0], p[1], C('#fff2c4')); px(p[0], p[1] + 1, C('#ffe9a0')); }); }
  if (winter()) F.box(u0, -th, z + leg + hgt, u1 - u0, th, .08, SNOW, { ol: false });
}
/** scatter rooftop clutter in a region, drawn back-to-front. kinds: string of letters a=ac A=big ac v=vent h=hut t=tank d=dish s=solar k=skylight */
export function clutter(r, x0, x1, y0, y1, z, kinds = 'aavhdsk', dens = .6, extra = []) {
  const items = extra.slice(), cs = 2;
  for (let x = x0; x + 1.4 <= x1; x += cs) for (let y = y0; y + 1.4 <= y1; y += cs) if (r() < dens) items.push([x + r() * Math.min(.5, Math.max(0, x1 - x - 1.5)), y + r() * Math.min(.5, Math.max(0, y1 - y - 1.5)), kinds[Math.floor(r() * kinds.length)]]);
  items.sort((a, b) => a[0] + a[1] - b[0] - b[1]);
  for (const [x, y, k] of items) {
    if (typeof k === 'function') k(x, y);
    else if (k === 'a') ac(x, y, z); else if (k === 'A') ac(x, y, z, 1.25); else if (k === 'v') { vent(x + .3, y + .3, z); vent(x + .9, y + .5, z, .3); }
    else if (k === 'h') hut(x, y, z, 1.4, 1.3, 1.3); else if (k === 't') tank(x + .7, y + .7, z); else if (k === 'd') dish(x + .6, y + .6, z);
    else if (k === 's') solar(x, y, z, 2); else if (k === 'k') skylight(x, y, z, 1.3, 1.1);
  }
}

/* ---------- street level ---------- */
/** shop / lobby glazing with warm glow, mullions and a plinth. o: { glowc, bayw, frame, plinth, sil: fn drawn as silhouettes } */
export function shopGlass(F, u0, u1, z0, z1, o = {}) {
  const fr = o.frame || '#2e3440', gc = o.glowc || ['#ffe6ac', '#f8d48c'], g = o.glass || ['#7fb6d0', '#9fcbe0'];
  F.win(u0, u1, z0, z1, { on: true, frame: fr, glass: F.xf ? g.map(c => dk(c, .14)) : g, glowc: F.xf ? gc.map(c => dk(c, .07)) : gc });
  if (o.sil) o.sil();
  const n = Math.max(1, Math.round((u1 - u0) / (o.bayw || 1.2)));
  for (let i = 1; i < n; i++) { const u = u0 + (u1 - u0) * i / n; F.l(u, z0, u, z1, fr); }
  if (o.transom) F.l(u0, z1 - o.transom, u1, z1 - o.transom, fr);
  F.l(u0, z0, u1, z0, fr); F.l(u0, z1, u1, z1, fr);
}
/** silhouettes for display windows: kind 'man' mannequins, 'box' products, 'sofa', 'plant', 'desk' */
export function sil(F, u, z, kind, c = '#3a4458', off = .01) {
  const q = (a, b, za, zb, col) => F.q(u + a, u + b, z + za, z + zb, col || c, undefined, off);
  if (kind === 'man') { q(-.12, .12, .25, .85, c); q(-.2, .2, .55, .82); q(-.08, .08, .9, 1.08, lt(c, .25)); q(-.12, -.02, 0, .3); q(.02, .12, 0, .3); }
  else if (kind === 'dress') { q(-.22, .22, .1, .5, c); q(-.14, .14, .5, .85); q(-.07, .07, .9, 1.06, lt(c, .25)); q(-.02, .02, 0, .1); }
  else if (kind === 'box') { q(-.25, .25, 0, .4); q(-.15, .2, .4, .7, lt(c, .15)); }
  else if (kind === 'sofa') { q(-.45, .45, 0, .32); q(-.45, .45, .32, .6, lt(c, .15)); q(-.5, -.4, 0, .5); q(.4, .5, 0, .5); }
  else if (kind === 'tv') { q(-.4, .4, .3, .85, '#2a3040'); lit(() => q(-.34, .34, .36, .79, '#8fd8ff')); q(-.05, .05, 0, .3); q(-.2, .2, 0, .06); }
  else if (kind === 'lamp') { q(-.03, .03, 0, .8); q(-.18, .18, .8, 1.05, lt(c, .3)); glow(() => q(-.18, .18, .8, 1.05, '#fff2c4')); }
  else if (kind === 'plant') { q(-.12, .12, 0, .25, '#8a5a3a'); q(-.2, .2, .25, .75, '#3f8a55'); q(-.1, .1, .75, .95, '#3f8a55'); }
  else if (kind === 'desk') { q(-.5, .5, 0, .5); q(-.5, .5, .5, .58, lt(c, .3)); }
  else if (kind === 'weights') { q(-.4, .4, .28, .34, lt(c, .3)); q(-.42, -.3, .14, .48); q(.3, .42, .14, .48); q(-.03, .03, 0, .3); }
  else if (kind === 'tread') { q(-.35, .35, 0, .14); q(.25, .33, .14, .8); q(.1, .36, .8, .9, lt(c, .3)); }
  else if (kind === 'person') { q(-.13, .13, .0, .75, c); q(-.09, .09, .78, 1.0, lt(c, .2)); }
}
/** glass double door, w wide, centred at u. Returns nothing. */
export function glassDoor(F, u, z, o = {}) {
  const w = o.w || 1.1, h = o.h || 1.7, fr = o.frame || '#2e3440', gc = o.glowc || ['#ffe6ac', '#f8d48c'];
  F.q(u - w / 2 - .08, u + w / 2 + .08, z, z + h + .08, fr);
  for (const s of [-1, 1]) { const a = s < 0 ? u - w / 2 : u + .03, b = s < 0 ? u - .03 : u + w / 2; F.q(a, b, z + .08, z + h, F.sh('#8ec4da'), F.sh('#a8d6e6')); glow(() => F.q(a, b, z + .08, z + h, gc[0], gc[1])); F.l(a, z + h, b, z + h, fr); }
  F.l(u - .1, z + .7, u - .1, z + .95, '#e8d08a', .01); F.l(u + .1, z + .7, u + .1, z + .95, '#e8d08a', .01);
  if (o.step !== false) F.box(u - w / 2 - .2, 0, z - .001, w + .4, .22, .06, '#c9c4b8', { ol: false });
}
/** revolving door drum, centred at u, protruding from the face */
export function revolving(F, u, z, o = {}) {
  const fr = o.frame || '#2e3440', h = 1.9, r = .62;
  F.q(u - r - .1, u + r + .1, z, z + h + .25, fr);
  const p = F.P(u, .05, z); cyl(p[0], p[1], z, r, h, '#9cc8da', { l: '#a6d2e2', r: '#7fb0c6', t: fr });
  glow(() => { F.q(u - r + .08, u - .04, z + .1, z + h - .1, '#ffe6ac', '#f8d48c', r * .7); F.q(u + .04, u + r - .08, z + .1, z + h - .1, '#f8d48c', '#f0c070', r * .7); });
  F.l(u, z, u, z + h, fr, r); F.l(u - r * .8, z + h, u + r * .8, z + h, fr, r * .6);
  cyl(p[0], p[1], z + h, r + .06, .18, o.cap || '#c9a24a');
}
/** sloped fabric awning on face F. c2 = stripe colour (optional) */
export function awning(F, u0, u1, z, dep, c1, c2, o = {}) {
  const rise = o.rise === undefined ? .45 : o.rise, n = Math.max(1, Math.round((u1 - u0) / .5)), bw = (u1 - u0) / n, sc = F.xf ? .12 : 0;
  for (let i = 0; i < n; i++) { const a = u0 + i * bw, b = a + bw, c = c2 && i % 2 ? c2 : c1; fq([F.P(a, 0, z + rise), F.P(b, 0, z + rise), F.P(b, dep, z), F.P(a, dep, z)], dk(c, sc)); F.q(a, b, z - .2, z, dk(c, .2 + sc), undefined, dep); }
  if (winter()) fq([F.P(u0, 0, z + rise), F.P(u1, 0, z + rise), F.P(u1, dep * .6, z + rise * .4), F.P(u0, dep * .6, z + rise * .4)], SNOW, 'glass');
  const e = dk(c1, .55); lw(F.P(u0, dep, z), F.P(u1, dep, z), e); lw(F.P(u0, dep, z - .2), F.P(u1, dep, z - .2), e); lw(F.P(u0, 0, z + rise), F.P(u1, 0, z + rise), e);
  for (const u of [u0, u1]) { lw(F.P(u, 0, z + rise), F.P(u, dep, z), e); lw(F.P(u, dep, z), F.P(u, dep, z - .2), e); }
  if (o.text) { const W = textW(o.text) / U; lit(() => bigText(F, o.text, F.xf ? (u0 + u1) / 2 + W / 2 : (u0 + u1) / 2 - W / 2, z - .02, o.tc || '#fff8e0', 1, dep + .01)); }
}
/** flat canopy slab with posts and downlights */
export function canopy(F, u0, u1, z, dep, c, o = {}) {
  if (o.posts !== false) for (const u of [u0 + .12, u1 - .12]) { const p = F.P(u, dep - .15, 0); box(p[0] - .06, p[1] - .06, 0, .12, .12, z, o.pc || '#c9a24a', { ol: false }); }
  F.box(u0, 0, z, u1 - u0, dep, o.th || .22, c);
  if (o.trim) { F.q(u0, u1, z, z + .07, o.trim, undefined, dep); }
  glow(() => { for (let u = u0 + .4; u < u1 - .2; u += .7) { const p = PW(...F.P(u, dep - .02, z - .02)); px(p[0], p[1], C('#fff2c4')); px(p[0], p[1] + 1, C('#ffe9a0')); px(p[0] + 1, p[1], C('#fff2c4')); } });
  if (winter()) { const a = F.P(u0 + .1, .1, 0), b = F.P(u1 - .1, dep - .1, 0); snowTop(Math.min(a[0], b[0]), Math.max(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[1], b[1]), z + (o.th || .22)); }
}
/** street planter box with seasonal planting */
export function planter(x, y, w, d, r, o = {}) {
  const c = o.c || '#8a8f9a', h = o.h || .45; box(x, y, 0, w, d, h, c); qz(x + .08, x + w - .08, y + .08, y + d - .08, h, '#5a4638');
  const n = Math.max(1, Math.round(Math.max(w, d) / .55));
  for (let i = 0; i < n; i++) { const t = (i + .5) / n, bx = w >= d ? x + t * w : x + w / 2, by = w >= d ? y + d / 2 : y + t * d, v = r();
    if (o.tree && i === (n >> 1)) { lw([bx, by, h], [bx, by, h + .9], '#6b4a2f'); const f = foliage('leaf', v); if (f) ball(bx, by, h + 1.3, .55, f); else { lw([bx, by, h + .9], [bx - .3, by, h + 1.4], '#6b4a2f'); lw([bx, by, h + .9], [bx + .3, by, h + 1.5], '#6b4a2f'); } continue; }
    if (winter()) ball(bx, by, h + .15, .26, SNOW2, { t: SNOW, squash: .7 });
    else { const f = foliage(o.kind || (v < .3 ? 'blossom' : 'leaf'), v); ball(bx, by, h + .2, .28, f, { squash: .8 }); if (ENV.season < 2 && v > .35) { const p = PW(bx, by, h + .32); px(p[0], p[1], C(o.fl || '#ff7a9a')); px(p[0] - 2, p[1] + 1, C(o.fl || '#ffd84a')); } }
  }
}
/** flag on a pole. on a roof: vertical pole; wall: set o.wall to project from a +y wall */
export function flag(x, y, z, h, c, c2, o = {}) {
  const pc = '#d8d2c0';
  if (o.wall) { const tip = [x + (o.xf ? .7 : 0), y + (o.xf ? 0 : .7), z + .9]; lw([x, y, z], tip, pc); const f = o.xf ? [0, .55] : [.55, 0];
    fq([tip, [tip[0] - (o.xf ? .0 : 0), tip[1], tip[2] - .85], [tip[0] + f[0] * .0 + (o.xf ? 0 : .5), tip[1] + (o.xf ? -.5 : 0), tip[2] - .95], [tip[0] + (o.xf ? 0 : .5), tip[1] + (o.xf ? -.5 : 0), tip[2] - .1]], c);
    fq([[tip[0], tip[1], tip[2] - .45], [tip[0], tip[1], tip[2] - .85], [tip[0] + (o.xf ? 0 : .5), tip[1] + (o.xf ? -.5 : 0), tip[2] - .95], [tip[0] + (o.xf ? 0 : .5), tip[1] + (o.xf ? -.5 : 0), tip[2] - .55]], c2 || dk(c, .2)); return; }
  lw([x, y, z], [x, y, z + h], pc); const p = PW(x, y, z + h); px(p[0], p[1] - 1, C('#e8d08a'));
  fq([[x, y, z + h], [x + .9, y, z + h - .1], [x + .9, y, z + h - .65], [x, y, z + h - .55]], c); fq([[x, y, z + h - .3], [x + .9, y, z + h - .4], [x + .9, y, z + h - .65], [x, y, z + h - .55]], c2 || dk(c, .2));
}
/** wall sconce lamp */
export function sconce(F, u, z) { F.q(u - .05, u + .05, z, z + .2, '#3a3440', undefined, .02); glow(() => { const p = PW(...F.P(u, .06, z)); for (const [a, b, c] of [[0, 0, '#fff2c4'], [1, 0, '#fff2c4'], [0, 1, '#ffe9a0'], [1, 1, '#ffe9a0'], [0, 2, '#f4c870'], [-1, 1, '#f4c870'], [2, 1, '#f4c870']]) px(p[0] + a, p[1] + b, C(c)); }); }
/** horizontal ledge / cornice wrapping the two visible faces of box (x,y,w,d) at height z */
export function cornice(x, y, w, d, z, h, c, out = .12) { box(x - out, y - out, z, w + out * 2, d + out * 2, h, c, { ol: false }); const e = dk(c, .5); lw([x - out, y + d + out, z], [x + w + out, y + d + out, z], e); lw([x + w + out, y - out, z], [x + w + out, y + d + out, z], e); lw([x - out, y + d + out, z + h], [x + w + out, y + d + out, z + h], lt(c, .4)); lw([x + w + out, y - out, z + h], [x + w + out, y + d + out, z + h], lt(c, .3)); }
/** lit strip (neon / LED line) along a face */
export function neon(F, u0, z0, u1, z1, c, off = .02) { lit(() => F.l(u0, z0, u1, z1, c, off)); }
/** vertical blade sign projecting from the +y wall at x: letters stacked */
export function blade(F, u, z0, z1, str, bg, fg) {
  const p = F.P(u, 0, 0), w = .5; if (F.xf) box(p[0], p[1] - .06, z0, w, .12, z1 - z0, bg); else box(p[0] - .06, p[1], z0, .12, w, z1 - z0, bg);
  const G = F.xf ? FY(p[1] + .06) : FX(p[0] + .06), base = F.xf ? p[0] : p[1];
  lit(() => { G.q(base + .06, base + w - .06, z0 + .06, z1 - .06, bg); String(str).toUpperCase().split('').forEach((ch, i) => bigText(G, ch, G.xf ? base + w / 2 + 1.5 / U : base + w / 2 - 1.5 / U, z1 - .15 - i * 7 / U, fg, 1, .01)); });
}
/** framed glass volume: box in frame colour + curtain wall on both faces + parapet roof. o = curtain opts + { frame, m: corner pier width, cap: parapet height, roof:false } */
export function glassBox(x, y, z, w, d, h, o = {}) {
  const fr = o.frame || '#dfe3e6', m = o.m === undefined ? .15 : o.m, cap = o.cap === undefined ? .3 : o.cap;
  box(x, y, z, w, d, h, fr);
  curtain(FX(x + w), y + m, y + d - m, z, z + h - cap, Object.assign({}, o, { ph: (o.ph || 0) + 2 })); curtain(FY(y + d), x + m, x + w - m, z, z + h - cap, o);
  lw([x + w, y + d, z], [x + w, y + d, z + h], lt(fr, .3));
  if (o.roof !== false) roofTop(x, y, z + h, w, d, fr, { rc: o.rc });
}
/**
 * Tower base: stone-framed lobby with furnished interiors, door centred at du on +y, canopy, ground-floor shop, garage/dock on +x, public art.
 * o: { r, stone, accent, trim, name, du, door:'rev'|'glass', shop:'cafe'|'retail'|'lobby'|'office', shopName, side:'garage'|'dock'|'lobby'|'retail', art, awn, glowc, num }
 */
export function lobby(w, d, h, o = {}) {
  const st = o.stone || '#d9d2c4', du = o.du === undefined ? w / 2 : o.du, r = o.r || rng(1), FYd = FY(d), FXw = FX(w), gc = o.glowc, ac = o.accent || '#3d4a54', pl = dk(st, .3), zt = h - .5;
  const shop = o.shop || ['cafe', 'retail', 'lobby', 'cafe'][Math.floor(r() * 4)], side = o.side || (d >= 6.5 ? ['garage', 'dock', 'lobby', 'retail'][Math.floor(r() * 4)] : 'lobby'), artk = o.art === undefined ? ['sphere', 'arc', 'cubes', 'fountain', 'tree', 'bench'][Math.floor(r() * 6)] : o.art, awn = o.awn || ['#c8543a', '#2f6f5f', '#3f6f9f', '#e8b63a'][Math.floor(r() * 4)];
  box(0, 0, 0, w, d, h, st);
  for (const F of [FXw, FYd]) { const n = F.xf ? d : w; F.q(0, n, 0, .22, F.sh(pl)); F.q(0, n, h - .32, h - .22, F.sh(lt(st, .35))); F.q(0, n, h - .22, h - .16, F.sh(dk(st, .25))); }
  // +x face
  let y0 = .5;
  if (side === 'garage' && d >= 6) { garageDoor(FXw, .7, 2.9, Math.min(2.1, zt)); y0 = 3.7; } else if (side === 'dock' && d >= 6) { dock(FXw, .6, 2.8, r, Math.min(2, zt - .1)); y0 = 3.4; }
  scene(FXw, y0, d - .5, .25, zt, side === 'retail' ? 'retail' : 'lobby', r, { glowc: gc, transom: .4, accent: ac });
  if (side === 'retail') awning(FXw, y0 - .1, d - .4, zt + .05, .6, awn, '#f4f0e8');
  // +y face: left segment, door, right segment (shop)
  const lw0 = du - 1.5 - .5, rw = w - .5 - (du + 1.5);
  if (lw0 >= 1) scene(FYd, .5, du - 1.5, .25, zt, 'lobby', r, { glowc: gc, transom: .4, accent: ac });
  if (rw >= 1) { scene(FYd, du + 1.5, w - .5, .25, zt, rw < 1.8 ? 'lobby' : shop, r, { glowc: gc, transom: shop === 'lobby' ? .4 : 0, accent: ac });
    if (shop !== 'lobby' && rw >= 1.8) { awning(FYd, du + 1.4, w - .4, zt - .25, .7, awn, shop === 'cafe' ? '#f4f0e8' : null); const nm = o.shopName || (shop === 'cafe' ? ['COFFEE', 'CAFE', 'BEANS', 'DELI'] : shop === 'retail' ? ['SHOP', 'BOOKS', 'GIFTS', 'OPTICS'] : ['BANK', 'TRAVEL'])[Math.floor(r() * 4) % 2 + (r() < .5 ? 2 : 0)] || 'SHOP'; FYd.sign(nm, du + 1.6, Math.min(w - .5, du + 1.6 + (nm.length * 4 + 6) / 16), zt + .28, zt + .68, dk(awn, .45), '#fff2c4', { lit: true }); } }
  FYd.q(du - 1.3, du + 1.3, 0, h - .32, dk(st, .1)); FYd.q(du - 1.05, du + 1.05, 0, zt, '#2e3440');
  glow(() => FYd.q(du - 1, du + 1, .05, zt - .05, '#ffe6ac', '#f8d48c')); FYd.q(du - 1, du + 1, .05, zt - .05, '#8ec4da', '#a8d6e6');
  if (o.door === 'glass') glassDoor(FYd, du, 0, { glowc: gc, w: 1.3 }); else revolving(FYd, du, 0, { cap: o.trim || ac });
  for (const s of [-1, 1]) { sconce(FYd, du + s * 1.18, 1.45); }
  canopy(FYd, du - 1.5, du + 1.5, zt, 1.1, ac, { posts: false, trim: o.trim || lt(ac, .5) });
  if (o.name) FYd.sign(o.name, du - 1.5, du + 1.5, zt + .02, zt + .42, '#1f2a33', o.signc || '#ffd98a', { lit: true }, 1.12);
  else { const num = String(o.num || 100 + Math.floor(r() * 80) * 10); lit(() => bigText(FYd, num, du - bigW(num, 1) / 32, zt + .38, '#fff2c4', 1, 1.12)); }
  // apron: planters, art, cafe tables
  if (o.planters !== false) { if (du - 2.9 > .2) planter(du - 2.9, d + .25, 1.1, .5, r); }
  if (shop === 'cafe' && rw >= 2.4) { art('cafe', du + 2.4, d + .75, r, { c: awn }); if (rw >= 4) art('cafe', du + 4, d + .75, r, { c: awn }); art('board', du + 1.75, d + .5, r); } else if (du + 1.8 + 1.1 < w) planter(du + 1.8, d + .25, 1.1, .5, r);
  if (artk && artk !== 'none' && du - 2.9 > 1.6) art(artk, Math.max(.9, du - 4.4), d + .8, r);
}
/** asset factory: def = default params; dims(q) -> { h: solid height, top: extra above, front: extra beyond +y (default 1.6), side: extra beyond +x (default .4) } */
export function asset(id, tags, def, dims, draw, variants, extra = {}) {
  const Q = p => Object.assign({}, def, p);
  return Object.assign({ id: 'bld.downtown.' + id, kind: 'building', tags: ['downtown', ...tags], variants,
    size: p => { const q = Q(p); return [q.w, q.d, dims(q).h]; },
    vb: p => { const q = Q(p), D = dims(q); return [-(D.left || .4), -.4, 0, q.w + (D.side === undefined ? .4 : D.side), q.d + (D.front === undefined ? 1.6 : D.front), D.h + (D.top || 0) + .4]; },
    draw: p => draw(Q(p)) }, extra);
}
/** static door/light + function forms for custom sizes */
export const entry = (at, d, r = 3.5) => ({ door: { side: 'y', at }, light: { x: at, y: d + 1.2, z: 0, r }, doorFn: () => ({ side: 'y', at }), lightFn: p => ({ x: at, y: ((p && p.d) || d) + 1.2, z: 0, r }) });
export const poly = (w, d, c) => (x, y) => x >= 0 && x <= w && y >= 0 && y <= d && x + y <= w + d - c;

/* ---------- interiors seen through glass ---------- */
const TINT = c => mix(c, '#7fb6d0', .2);
/** tiny office vignette inside one curtain-wall cell (desk+monitor, person, plant, shelf, blinds). on = the cell is lit at night */
function mini(F, u0, u1, z0, z1, k, on, g) {
  if (k > .78) return; const m = (u0 + u1) / 2, q = (a, b, za, zb, c) => F.q(m + a, m + b, z0 + za, z0 + zb, F.sh(mix(c, g, .3)), undefined, .005), d = () => {
    if (k < .2) { q(-.22, .22, 0, .42, '#b08a62'); q(-.1, .12, .5, .74, '#2a3040'); q(-.02, .04, .42, .5, '#2a3040'); }
    else if (k < .36) { q(-.11, .11, 0, .62, '#4a5a8a'); q(-.08, .08, .64, .84, '#e8b890'); q(-.08, .08, .8, .86, '#4a3428'); }
    else if (k < .48) { q(-.08, .08, 0, .18, '#9a6a4a'); q(-.14, .14, .18, .52, '#4f9a55'); q(-.07, .07, .52, .7, '#5aa84f'); }
    else if (k < .6) { q(-.2, .2, 0, .9, '#8a7460'); for (const z of [.12, .4, .66]) { q(-.16, -.04, z, z + .18, '#c8543a'); q(0, .16, z, z + .14, '#e8c06a'); } }
    else if (k < .7) { q(-.2, .2, 0, .34, '#5a8f9a'); q(-.2, .2, .34, .56, '#6aa0aa'); }
    else for (let z = z1 - z0 - .12; z > (z1 - z0) * (.35 + k * .2); z -= .12) F.l(u0, z0 + z, u1, z0 + z, F.sh(lt(g, .55)), .005);
  };
  if (on && k < .7) { lit(d); if (k < .2) lit(() => q(-.07, .09, .53, .71, '#9fe0ff')); } else d();
}
/**
 * Shop / lobby window with a furnished interior visible through the glass (bright at night).
 * kind: 'lobby' | 'cafe' | 'retail' | 'office' | 'gym' | 'fashion' | 'home' | 'bank'.  o: { glowc, frame, bayw, accent, transom }
 */
export function scene(F, u0, u1, z0, z1, kind, r, o = {}) {
  const gc = o.glowc || ['#ffe6ac', '#f8d48c'], fr = o.frame || '#2e3440', g = o.glass || ['#7fb6d0', '#9fcbe0'], W = u1 - u0, H = z1 - z0, ac = o.accent || '#c8543a';
  F.win(u0, u1, z0, z1, { on: true, frame: fr, glass: F.xf ? g.map(c => dk(c, .14)) : g, glowc: F.xf ? gc.map(c => dk(c, .07)) : gc });
  const q = (a, b, za, zb, c) => { a = Math.max(.02, a); b = Math.min(W - .02, b); zb = Math.min(H - .02, zb); if (b > a && zb > za) F.q(u0 + a, u0 + b, z0 + za, z0 + zb, F.sh(TINT(c)), undefined, .005); };
  const skin = () => ['#e8b890', '#c68a5e', '#8a5a3c', '#f0c8a0'][Math.floor(r() * 4)], cloth = () => ['#c8543a', '#3f6f9f', '#4f9a8e', '#e8b63a', '#8a5aa8', '#f4f0e8', '#3a4458'][Math.floor(r() * 7)];
  const I = {
    person: (x, z = 0) => { const c = cloth(); q(x - .1, x - .01, z, z + .5, '#3a4458'); q(x + .01, x + .1, z, z + .5, '#3a4458'); q(x - .14, x + .14, z + .5, z + 1, c); q(x - .09, x + .09, z + 1.02, z + 1.24, skin()); q(x - .09, x + .09, z + 1.18, z + 1.26, '#4a3428'); },
    seated: (x, z = .35) => { q(x - .13, x + .13, z, z + .45, cloth()); q(x - .09, x + .09, z + .47, z + .68, skin()); },
    plant: x => { q(x - .12, x + .12, 0, .28, '#9a6a4a'); q(x - .22, x + .22, .28, .8, '#4f9a55'); q(x - .12, x + .14, .8, 1.1, '#5aa84f'); q(x - .05, x + .05, 1.1, 1.25, '#4f9a55'); },
    sofa: x => { const c = ['#4f9a8e', '#c8543a', '#e8b63a', '#5a6aa8'][Math.floor(r() * 4)]; q(x - .5, x + .5, 0, .3, c); q(x - .5, x + .5, .3, .55, lt(c, .2)); q(x - .56, x - .44, 0, .45, dk(c, .15)); q(x + .44, x + .56, 0, .45, dk(c, .15)); },
    pend: x => { q(x - .01, x + .03, H - .35, H, '#3a3440'); q(x - .1, x + .12, H - .48, H - .35, '#fff8e0'); },
    art: x => { q(x - .38, x + .38, .85, 1.5, '#f4f0e8'); q(x - .3, x, .93, 1.42, ac); q(x + .05, x + .3, 1.1, 1.42, '#3f6f9f'); q(x + .05, x + .3, .93, 1.05, '#e8b63a'); },
    lift: x => { q(x - .45, x + .45, 0, 1.4, '#7d838e'); q(x - .38, x - .02, 0, 1.3, '#b4bac2'); q(x + .02, x + .38, 0, 1.3, '#a6acb6'); q(x - .08, x + .08, 1.44, 1.52, '#7dffb0'); },
    desk: x => { q(x - .5, x + .5, 0, .5, '#b08a62'); q(x - .5, x + .5, .5, .57, '#d8b88a'); q(x - .16, x + .16, .68, .95, '#2a3040'); q(x - .12, x + .12, .72, .91, '#9fe0ff'); q(x - .02, x + .04, .57, .68, '#2a3040'); },
    recep: x => { I.person(x + .1, .0); q(x - .8, x + .8, 0, .62, '#e8e2d4'); q(x - .8, x + .8, .5, .62, ac); q(x - .8, x + .8, .62, .68, '#fff8e0'); q(x - .5, x - .25, .68, .86, '#2a3040'); },
    counter: x => { I.person(x - .2); q(x - .8, x + .8, 0, .58, '#6b4a2f'); q(x - .8, x + .8, .58, .64, '#d8b88a'); q(x + .2, x + .6, .64, .98, '#c2c8d0'); q(x + .26, x + .54, .7, .8, '#3a3440'); q(x - .7, x - .35, .64, .9, '#cfe8f0'); q(x - .66, x - .4, .66, .76, '#e8a04a'); },
    menu: x => { q(x - .55, x + .55, H - .78, H - .2, '#2a3040'); for (let i = 0; i < 3; i++) q(x - .45, x + .1 + (i % 2) * .25, H - .36 - i * .15, H - .31 - i * .15, i ? '#f4f0e8' : '#ffd98a'); },
    stool: x => { q(x - .02, x + .02, 0, .35, '#3a3440'); q(x - .12, x + .12, .32, .38, '#3a3440'); I.seated(x); q(x - .3, x + .3, .0, .04, '#3a3440'); },
    table: x => { q(x - .3, x + .3, .4, .46, '#d8b88a'); q(x - .03, x + .03, 0, .4, '#3a3440'); I.seated(x - .42, .3); I.seated(x + .42, .3); q(x - .08, x + .02, .46, .58, '#f4f0e8'); },
    shelf: x => { q(x - .42, x + .42, 0, 1.3, '#8a7460'); for (const z of [.08, .5, .92]) for (let a = -.36; a < .3; a += .18) q(x + a, x + a + .13, z, z + .2 + r() * .12, cloth()); },
    manq: x => { const c = cloth(); q(x - .03, x + .03, 0, .3, '#c2c8d0'); q(x - .16, x + .16, .3, .7, dk(c, .1)); q(x - .14, x + .14, .7, 1.05, c); q(x - .07, x + .07, 1.08, 1.26, '#e4e0d8'); },
    dress: x => { const c = cloth(); q(x - .03, x + .03, 0, .2, '#c2c8d0'); q(x - .24, x + .24, .2, .6, c); q(x - .16, x + .16, .6, .8, c); q(x - .12, x + .12, .8, 1.05, lt(c, .15)); q(x - .07, x + .07, 1.08, 1.26, '#e4e0d8'); },
    rack: x => { q(x - .45, x + .45, 1.0, 1.04, '#c2c8d0'); q(x - .45, x - .41, 0, 1.04, '#c2c8d0'); q(x + .41, x + .45, 0, 1.04, '#c2c8d0'); for (let a = -.36; a < .32; a += .14) q(x + a, x + a + .1, .42 + r() * .15, 1, cloth()); },
    poster: x => { q(x - .3, x + .3, .7, 1.45, ac); q(x - .22, x + .22, 1.15, 1.22, '#fff8e0'); q(x - .22, x + .1, .98, 1.04, '#fff8e0'); },
    tv: x => { q(x - .45, x + .45, .5, 1.1, '#22283a'); q(x - .4, x + .4, .55, 1.05, ['#8fd8ff', '#9cf2b0', '#ffb0d0'][Math.floor(r() * 3)]); q(x - .3, x + .1, .62, .8, '#f4f0e8'); q(x - .5, x + .5, 0, .42, '#8a7460'); },
    lampf: x => { q(x - .02, x + .02, 0, .95, '#3a3440'); q(x - .16, x + .16, .95, 1.2, '#fff2c4'); },
    bed: x => { q(x - .6, x + .6, 0, .3, '#8a7460'); q(x - .6, x + .6, .3, .45, '#f4f0e8'); q(x - .6, x - .3, .45, .58, '#e8b63a'); q(x - .66, x - .58, 0, .8, '#6b4a2f'); },
    tread: x => { q(x - .4, x + .4, 0, .14, '#3a3f4a'); q(x + .3, x + .36, .14, .9, '#3a3f4a'); q(x + .14, x + .4, .9, 1, '#22283a'); I.person(x - .08, .14); },
    weights: x => { q(x - .45, x + .45, 0, .08, '#3a3f4a'); q(x - .4, x - .34, 0, 1.1, '#5a606c'); q(x + .34, x + .4, 0, 1.1, '#5a606c'); q(x - .5, x + .5, .8, .85, '#c2c8d0'); q(x - .56, x - .44, .66, .98, '#22283a'); q(x + .44, x + .56, .66, .98, '#22283a'); for (const z of [.2, .45]) for (let a = -.28; a < .2; a += .2) q(x + a, x + a + .14, z, z + .14, '#22283a'); },
    bag: x => { q(x - .02, x + .02, .95, H, '#3a3440'); q(x - .14, x + .14, .3, .95, ac); q(x - .14, x + .14, .58, .64, '#22283a'); },
    teller: x => { I.person(x); q(x - .55, x + .55, 0, .66, '#6b4a2f'); q(x - .55, x + .55, .66, .72, '#c9a24a'); q(x - .5, x + .5, .72, 1.3, '#cfe8f0'); q(x - .5, x + .5, 1.3, 1.36, '#c9a24a'); },
    vault: x => { q(x - .5, x + .5, 0, 1.3, '#8a909c'); q(x - .36, x + .36, .2, 1.1, '#aab0ba'); q(x - .1, x + .1, .55, .75, '#c9a24a'); },
    queue: x => { I.person(x - .3); I.person(x + .25); },
  };
  const seqs = { lobby: ['plant', 'recep', 'art', 'sofa', 'lift', 'plant', 'sofa', 'art'], cafe: ['counter', 'menu', 'table', 'stool', 'plant', 'table'], retail: ['shelf', 'manq', 'poster', 'rack', 'shelf', 'dress'], office: ['desk', 'person', 'plant', 'desk', 'art', 'desk'],
    gym: ['tread', 'weights', 'bag', 'tread', 'poster', 'weights'], fashion: ['manq', 'dress', 'rack', 'manq', 'poster', 'dress', 'rack'], home: ['sofa', 'lampf', 'tv', 'bed', 'shelf', 'tv', 'sofa', 'lampf'], bank: ['teller', 'queue', 'plant', 'teller', 'vault', 'art'] };
  const sq = seqs[kind] || seqs.lobby, wd = { recep: 1.8, counter: 1.8, menu: .0, sofa: 1.3, table: 1.5, desk: 1.2, shelf: 1.05, rack: 1.1, tv: 1.1, bed: 1.4, lift: 1.1, tread: 1.1, weights: 1.2, teller: 1.3, vault: 1.2, queue: 1.1, art: .95, poster: .8 };
  lit(() => {
    q(0, W, 0, .06, '#a89a88');
    let x = .15, i = Math.floor(r() * 2), n = 0;
    while (x < W - .4 && n++ < 30) { const k = sq[i++ % sq.length], w = wd[k] === undefined ? .7 : wd[k]; if (k === 'menu') { if (W > 1.4) I.menu(Math.min(W - .65, Math.max(.65, x + .2))); continue; } if (x + w > W - .05) { if (W - x > .6) I.plant(x + .3); break; } I[k](x + w / 2); x += w + .12; }
    if (kind === 'lobby' || kind === 'cafe' || kind === 'bank') for (let a = .5; a < W - .2; a += 1.1) I.pend(a);
  });
  const n = Math.max(1, Math.round(W / (o.bayw || 1.3)));
  for (let i = 1; i < n; i++) { const u = u0 + W * i / n; F.l(u, z0, u, z1, fr); }
  if (o.transom) F.l(u0, z1 - o.transom, u1, z1 - o.transom, fr);
  F.l(u0, z0, u1, z0, fr); F.l(u0, z1, u1, z1, fr);
}
/** parking-garage entrance cut into face F between u0..u1 */
export function garageDoor(F, u0, u1, h = 2) {
  F.q(u0, u1, 0, h, F.sh('#2e2c38')); F.q(u0 + .15, u1 - .15, 0, h * .45, F.sh('#45434f')); for (let z = .15; z < h * .45; z += .22) F.l(u0 + .15, z, u1 - .15, z, F.sh('#55535f'));
  lit(() => F.q(u0 + .3, u1 - .3, h - .32, h - .24, '#dff1ff')); glow(() => F.q(u0 + .1, u1 - .1, h * .45, h - .35, '#5a6a8a', 'glass'));
  for (let u = u0, i = 0; u < u1 - .01; u += .25, i++) F.q(u, Math.min(u1, u + .25), h - .2, h, i % 2 ? '#f2c230' : '#2a2430', undefined, .01);
  const m = (u0 + u1) / 2, n = Math.round((u1 - u0 - .5) / .3); for (let i = 0; i < n; i++) F.q(u0 + .25 + i * .3, u0 + .55 + i * .3, .8, .92, i % 2 ? '#f4f0e8' : '#d63a3a', undefined, .15);
  const p = F.P(u0 + .2, .15, 0); box(p[0] - .09, p[1] - .09, 0, .18, .18, 1, '#f2c230', { ol: false });
  lit(() => F.sign('P', u1 + .12, u1 + .62, h - .5, h + .05, '#2f5fbf', '#ffffff', { frame: false }, .03));
  for (const u of [u0 - .12, u1 + .0]) { const b = F.P(u, .2, 0); cyl(b[0], b[1], 0, .09, .55, '#f2c230'); }
}
/** loading dock: raised platform, roller shutter, crates */
export function dock(F, u0, u1, r, h = 2.1) {
  F.q(u0, u1, .55, h, (a, b) => b % 3 === 0 ? '#6a707c' : (F.xf ? '#8d939e' : '#a2a8b2')); F.l(u0, h, u1, h, '#3a3f4a'); F.l(u0, .55, u0, h, '#3a3f4a'); F.l(u1, .55, u1, h, '#3a3f4a');
  F.box(u0 - .1, 0, 0, u1 - u0 + .2, .35, .55, '#8a8f9a'); for (let u = u0, i = 0; u < u1; u += .25, i++) F.q(u, Math.min(u1 + .1, u + .25), .4, .55, i % 2 ? '#f2c230' : '#2a2430', undefined, .36);
  F.q(u0 + .1, u0 + .3, .1, .4, '#22222a', undefined, .36); F.q(u1 - .3, u1 - .1, .1, .4, '#22222a', undefined, .36);
  F.box(u0 + .2, .02, .55, .5, .3, .45, '#b08a5a'); if (r() < .6) F.box(u0 + .28, .04, 1, .4, .26, .35, '#c49a6a'); if (r() < .6) F.box(u1 - .7, .02, .55, .45, .3, .3, '#5a8f9a');
  sconce(F, (u0 + u1) / 2, h + .1); F.sign('DOCK ' + (1 + Math.floor(r() * 4)), u0 + .1, u0 + 1.6, h + .32, h + .72, '#f4f0e8', '#3a3f4a', {}, .02);
}
/** public art / street furniture for the apron in front of a tower. kind: sphere | arc | cubes | fountain | tree | bench | cafe | bikes | none */
export function art(kind, x, y, r, o = {}) {
  const c = o.c || ['#d63a3a', '#e8b63a', '#3f6f9f', '#4f9a8e'][Math.floor(r() * 4)];
  if (kind === 'sphere') { box(x - .35, y - .35, 0, .7, .7, .35, '#8a8f9a'); ball(x, y, .95, .55, '#c2c8d0', { t: '#f4f8fb', d: '#7d838e' }); const p = PW(x, y, 1.2); px(p[0] - 3, p[1] - 2, C('#ffffff')); px(p[0] - 2, p[1] - 3, C('#ffffff')); }
  else if (kind === 'arc') { box(x - .6, y - .3, 0, 1.2, .6, .2, '#8a8f9a'); for (let k = 0; k < 3; k++) { const a = [x - .45 + k * .06, y, .2], b = [x + .1 + k * .06, y, 2.3], e = [x + .5 + k * .06, y, .9]; lw(a, b, k === 1 ? c : dk(c, .25)); lw(b, e, k === 1 ? lt(c, .2) : c); } lw([x + .35, y, .2], [x - .1, y, 1.5], dk(c, .1)); lw([x + .41, y, .2], [x - .04, y, 1.5], c); }
  else if (kind === 'cubes') { box(x - .35, y - .35, 0, .7, .7, .7, c); box(x - .15, y - .45, .7, .6, .6, .6, '#e8b63a'); box(x - .4, y - .2, 1.3, .5, .5, .5, '#3f6f9f'); }
  else if (kind === 'fountain') { cyl(x, y, 0, .8, .3, '#b4b0a6', { t: winter() ? SNOW2 : '#6ab8d8', t2: winter() ? SNOW : '#8fd0e8' }); cyl(x, y, .3, .16, .35, '#c9c4b8'); if (!winter()) { lit(() => { lw([x, y, .65], [x, y, 1.3], '#e8f6fb'); lw([x, y, 1.3], [x - .25, y, .9], '#cfeaf5'); lw([x, y, 1.3], [x + .25, y, .9], '#cfeaf5'); lw([x, y, 1.3], [x, y + .25, .85], '#cfeaf5'); }); glow(() => { const p = PW(x, y, .3); ellipse(p[0], p[1], 12, 6, '#5fd4ff', 'glass'); }); } }
  else if (kind === 'tree') { qz(x - .45, x + .45, y - .45, y + .45, .01, '#5a5560', '#6a6570'); box(x - .08, y - .08, 0, .16, .16, 1.5, '#6b4a2f', { ol: false }); const f = foliage('leaf', r()); if (f) { ball(x, y, 2.2, .85, f); ball(x - .35, y + .2, 1.9, .5, dk(f, .08)); ball(x + .3, y - .1, 2.6, .5, lt(f, .1)); } else { for (const [a, b] of [[-.5, 2.4], [.5, 2.5], [0, 2.9], [-.25, 2.1]]) lw([x, y, 1.5], [x + a, y, b], '#6b4a2f'); glow(() => { for (let i = 0; i < 10; i++) { const p = PW(x - .5 + r(), y, 1.6 + r() * 1.2); px(p[0], p[1], C('#ffe9a0')); } }); } }
  else if (kind === 'bench') { box(x - .6, y - .18, .3, 1.2, .36, .08, '#b08a5a'); box(x - .6, y - .2, .38, 1.2, .07, .35, '#b08a5a', { ol: false }); for (const a of [-.5, .42]) box(x + a, y - .15, 0, .08, .3, .3, '#3a3f4a', { ol: false }); }
  else if (kind === 'cafe') { for (const a of [-.55, .55]) { box(x + a - .12, y - .12, 0, .24, .24, .32, c, { ol: false }); } cyl(x, y, 0, .05, .5, '#5a606c', { ol: false }); cyl(x, y, .5, .3, .05, '#f4f0e8'); if (ENV.season === 1 || ENV.season === 0) { lw([x, y, .55], [x, y, 1.7], '#5a606c'); cone(x, y, 1.45, .75, .4, c); } else { const p = PW(x, y, .6); px(p[0], p[1] - 1, C('#f4f0e8')); px(p[0] + 1, p[1] - 1, C('#f4f0e8')); } }
  else if (kind === 'bikes') { lw([x - .6, y, .45], [x + .6, y, .45], '#8a909c'); lw([x - .6, y, 0], [x - .6, y, .45], '#8a909c'); lw([x + .6, y, 0], [x + .6, y, .45], '#8a909c'); for (const a of [-.3, .2]) { const p = PW(x + a, y + .1, .22), cc = C(a < 0 ? c : '#3a3f4a'); for (const o2 of [-3, 3]) for (const [e, f] of [[-1, -2], [0, -2], [1, -2], [-2, -1], [2, -1], [-2, 0], [2, 0], [-1, 1], [0, 1], [1, 1]]) px(p[0] + o2 + e, p[1] + f, C('#2a2a34')); for (let e = -3; e <= 3; e++) px(p[0] + e, p[1] - 3, cc); px(p[0] - 3, p[1] - 4, cc); px(p[0] + 3, p[1] - 5, cc); px(p[0] + 3, p[1] - 4, cc); } }
  else if (kind === 'board') { fq([[x - .2, y, 0], [x + .2, y, 0], [x + .2, y - .12, .7], [x - .2, y - .12, .7]], '#2a3040'); const p = PW(x, y - .06, .5); for (let i = 0; i < 3; i++) { px(p[0] - 2, p[1] + i * 2 - 1, C('#f4f0e8')); px(p[0] - 1, p[1] + i * 2 - 1, C('#f4f0e8')); px(p[0] + (i % 2), p[1] + i * 2 - 1 + 0, C('#ffd98a')); } }
}
/** rooftop cooling tower with fan */
export function cooling(x, y, z, s = 1) { box(x, y, z, 1.4 * s, 1.4 * s, .9 * s, '#a8aeb8', { l: (u, v) => v % 3 === 1 ? '#6d7480' : '#969ca6', r: (u, v) => v % 3 === 1 ? '#5a606c' : '#7d838e' }); cyl(x + .7 * s, y + .7 * s, z + .9 * s, .5 * s, .3 * s, '#c2c8d0', { t: '#4c525e' }); const p = PW(x + .7 * s, y + .7 * s, z + 1.2 * s); line([p[0] - 6 * s, p[1]], [p[0] + 6 * s, p[1]], '#8a909c'); line([p[0], p[1] - 3 * s], [p[0], p[1] + 3 * s], '#8a909c'); if (winter()) qz(x, x + 1.4 * s, y, y + .35 * s, z + .9 * s, SNOW, 'glass'); }
/** window-washing rig: roof crane at (x,y,z) with a cradle hanging down the +y face (F) by drop units */
export function bmu(F, u, z, drop, o = {}) {
  const p = F.P(u, -.9, z); box(p[0] - .35, p[1] - .35, z, .7, .7, .45, '#f2c230'); lw([p[0], p[1], z + .45], F.P(u, .35, z + 1.1), '#5a606c'); lw(F.P(u, -.9, z + .45), F.P(u, -.9, z + .9), '#5a606c'); lw(F.P(u, -.9, z + .9), F.P(u, .35, z + 1.1), '#5a606c');
  for (const a of [-.4, .4]) lw(F.P(u + a, .35, z + 1.1), F.P(u + a, .35, z - drop + .5), '#3a3f4a'); lw(F.P(u - .4, .35, z + 1.1), F.P(u + .4, .35, z + 1.1), '#5a606c');
  F.box(u - .55, .12, z - drop, 1.1, .4, .5, '#e8843a'); const q = (a, b, za, zb, c) => F.q(u + a, u + b, z - drop + za, z - drop + zb, c, undefined, .3);
  q(-.25, -.05, .5, .95, '#3f6f9f'); q(-.22, -.08, .97, 1.15, '#e8b890'); q(-.24, -.06, 1.12, 1.2, '#f2c230'); q(.1, .3, .5, .9, '#c8543a'); q(.13, .27, .92, 1.1, '#c68a5e'); q(.11, .29, 1.07, 1.15, '#f2c230');
}
/** simple railing along a roof edge on face F (at the parapet) */
export function rail(F, u0, u1, z, c = '#c8d4dc') { F.l(u0, z + .5, u1, z + .5, c, -.1); F.l(u0, z + .28, u1, z + .28, dk(c, .15), -.1); for (let u = u0; u <= u1 + .01; u += .8) F.l(u, z, u, z + .5, dk(c, .1), -.1); }
