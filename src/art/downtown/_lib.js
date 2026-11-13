// Downtown kit: shared helpers (facades, curtain walls, rooftop clutter, street-level bits). Local to src/art/downtown.
import { U, ENV, C, dk, lt, mix, rng, hash2, PW, px, fill, line, ellipse, fq, lw, qy, qx, qz, box, cyl, ball, cone, glow, lit, winY, winX, signY, signX, textW, foliage, grassC, isFlipped } from '../../engine/raster.js';

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
  const n = Math.max(1, Math.round((a1 - a0) / bay)), bw = (a1 - a0) / n, nf = Math.max(1, Math.round((z1 - z0) / fh)), fhh = (z1 - z0) / nf, ph = o.ph || 0, f0 = o.f0 || 0;
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
      if (L && L.on(f + f0)) { const gc = L.col(f + f0), bl = L.r() < .22; glow(() => F.q(u0, u1, bl ? zg + (zt - zg) * .45 : zg, zt, F.xf ? gc[1] : gc[0], F.xf ? dk(gc[1], .08) : gc[1])); }
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
/** standard tower lobby: stone base with glowing glass, revolving door centred at du on +y, canopy, planters. Returns nothing. */
export function lobby(w, d, h, o = {}) {
  const st = o.stone || '#d9d2c4', du = o.du === undefined ? w / 2 : o.du, r = o.r || rng(1), FYd = FY(d), FXw = FX(w), gc = o.glowc;
  box(0, 0, 0, w, d, h, st);
  shopGlass(FXw, .5, d - .5, .25, h - .45, { bayw: 1.1, transom: .5, glowc: gc, sil: () => { for (let y = 1.2; y < d - 1; y += 2.2) sil(FXw, y, .25, r() < .5 ? 'plant' : 'desk', '#4a5068'); } });
  shopGlass(FYd, .5, w - .5, .25, h - .45, { bayw: 1.1, transom: .5, glowc: gc, sil: () => { for (let x = 1.1; x < w - 1; x += 2.2) if (Math.abs(x - du) > 1.3) sil(FYd, x, .25, r() < .5 ? 'plant' : 'desk', '#4a5068'); } });
  FYd.q(du - 1, du + 1, 0, h - .45, dk(st, .1));
  if (o.door === 'glass') glassDoor(FYd, du, 0, { glowc: gc }); else revolving(FYd, du, 0, { cap: o.accent });
  canopy(FYd, du - 1.5, du + 1.5, h - .5, 1.1, o.accent || '#3d4a54', { posts: false, trim: o.trim });
  if (o.name) FYd.sign(o.name, du - 1.5, du + 1.5, h - .5 + .0, h - .1, '#1f2a33', o.signc || '#ffd98a', { lit: true }, 1.12);
  if (o.planters !== false) { if (du - 2.9 > .2) planter(du - 2.9, d + .25, 1.1, .5, r); if (du + 1.8 + 1.1 < w) planter(du + 1.8, d + .25, 1.1, .5, r); }
}
