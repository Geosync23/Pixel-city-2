// Shared helpers for the civic / arts-quarter building kit. Local to src/art/civic (see docs/ART_GUIDE.md).
import { U, ENV, C, PW, px, fill, fq, lw, qy, qx, qz, box, cyl, ball, cone, glow, lit, winY, winX, PAT, pal, dk, lt, mix, hash2, isFlipped, textW, ellipse, foliage } from '../../engine/raster.js';

export const SNOW = '#f4f8fb', SNOW2 = '#dfe8f0';
export const winter = () => ENV.season === 3;
export const snap = v => Math.round(v * 8) / 8;
export const pick = (r, a) => a[Math.floor(r() * a.length) % a.length];

/* wall-generic primitives: side 'y' = +y wall (a runs along x), side 'x' = +x wall (a runs along y) */
export const Q = (s, a0, a1, pl, z0, z1, h, h2) => s === 'y' ? qy(a0, a1, pl, z0, z1, h, h2) : qx(pl, a0, a1, z0, z1, h, h2);
export const P3 = (s, a, pl, z) => s === 'y' ? [a, pl, z] : [pl, a, z];
export const L = (s, a0, z0, a1, z1, pl, c) => lw(P3(s, a0, pl, z0), P3(s, a1, pl, z1), c);
/** patterned wall pair for box(): wallPat('brick', c) -> {l, r} */
export function wallPat(kind, c, extra) {
  const f = PAT[kind]; if (!f) return Object.assign({}, extra);
  return Object.assign({ l: f(dk(c, .18)), r: f(dk(c, .36)) }, extra);
}

/* ---------- text (own copy of the 3x5 font so we can scale it) ---------- */
const FONT = {
  A: '25755', B: '65656', C: '34443', D: '65556', E: '74647', F: '74644', G: '34553', H: '55755', I: '72227', J: '11152', K: '55655', L: '44447', M: '57555', N: '65555', O: '25552', P: '65644', Q: '25563', R: '65655', S: '34216', T: '72222', U: '55557', V: '55552', W: '55575', X: '55255', Y: '55222', Z: '71247',
  0: '75557', 1: '26227', 2: '61247', 3: '61216', 4: '55711', 5: '74616', 6: '34757', 7: '71222', 8: '75757', 9: '75716',
  ' ': '00000', '.': '00002', ',': '00024', '!': '22202', '?': '61202', '-': '00700', '+': '02720', ':': '02020', "'": '22000', '/': '11244', '&': '25256', '*': '05250',
};
function glyphs(str, s, plot) {
  str = String(str).toUpperCase();
  for (let i = 0; i < str.length; i++) { const g = FONT[str[i]] || FONT['?']; for (let r = 0; r < 5; r++) { const bits = +g[r]; for (let b = 0; b < 3; b++) if (bits & (4 >> b)) for (let a = 0; a < s; a++) for (let c = 0; c < s; c++) plot((i * 4 + b) * s + a, r * s + c); } }
}
/** world width of a string at scale s */
export const txtW = (str, s = 1) => textW(String(str)) * s / U;
/** text on a wall, top-left at (a, z) on plane pl; side 'y' or 'x'; s = integer scale. For side 'x', a is the HIGH y (screen-left) end. */
export function txt(side, str, a, pl, z, col, s = 1) {
  const fl = isFlipped(), W = textW(String(str)) * s, c = C(col);
  // which screen wall are we really on?
  const onY = (side === 'y') !== fl;
  let p;
  if (side === 'y') p = fl ? PW(a + W / U, pl, z) : PW(a, pl, z);
  else p = fl ? PW(pl, a - W / U, z) : PW(pl, a, z);
  const X = Math.round(p[0]), Y = Math.round(p[1]);
  glyphs(str, s, (u, v) => px(X + u, Y + (onY ? (u >> 1) : -(u >> 1)) + v, c));
}
/** sign board with centred text. o: {lit, s (scale), frame, glowbg} */
export function sign(side, str, a0, a1, pl, z0, z1, bg, fg, o = {}) {
  const s = o.s || 1, d = () => {
    if (bg) Q(side, a0, a1, pl, z0, z1, bg);
    const tw = txtW(str, s), zt = z1 - ((z1 - z0) - 5 * s / U) / 2;
    if (side === 'y') txt('y', str, a0 + ((a1 - a0) - tw) / 2, pl, zt, fg, s);
    else txt('x', str, a1 - ((a1 - a0) - tw) / 2, pl, zt, fg, s);
  };
  if (o.lit) lit(d); else d();
  if (bg && o.frame !== false) { const f = o.frame || dk(bg, .5); L(side, a0, z0, a1, z0, pl, f); L(side, a0, z1, a1, z1, pl, f); L(side, a0, z0, a0, z1, pl, f); L(side, a1, z0, a1, z1, pl, f); }
}
/** screen-aligned text centred on a world anchor (for round things like tanks) */
export function txtS(str, x, y, z, col, s = 1) { const p = PW(x, y, z), W = textW(String(str)) * s, c = C(col), X = Math.round(p[0] - W / 2), Y = Math.round(p[1]); glyphs(str, s, (u, v) => px(X + u, Y + v, c)); }

/** bitmap icon painted on a wall. rows = strings (top row first); palette maps char -> hex; ' ' / '.' = transparent. (a,z) = top-left. Mirrors when flipped. */
export function icon(side, rows, a, pl, z, palette, s = 1) {
  const fl = isFlipped(), onY = (side === 'y') !== fl, wpx = rows[0].length * s;
  let p; if (side === 'y') p = fl ? PW(a + wpx / U, pl, z) : PW(a, pl, z); else p = fl ? PW(pl, a - wpx / U, z) : PW(pl, a, z);
  const X = Math.round(p[0]), Y = Math.round(p[1]);
  // keep pictures un-mirrored on screen-left start; mirror horizontally when the wall changed handedness
  const mir = (side === 'y') === fl ? false : false;
  for (let r = 0; r < rows.length; r++) for (let i = 0; i < rows[r].length; i++) {
    const ch = rows[r][mir ? rows[r].length - 1 - i : i], h = palette[ch]; if (!h) continue; const c = C(h);
    for (let a2 = 0; a2 < s; a2++) for (let b = 0; b < s; b++) { const u = i * s + a2, v = r * s + b; px(X + u, Y + (onY ? (u >> 1) : -(u >> 1)) + v, c); }
  }
}
export const iconW = (rows, s = 1) => rows[0].length * s / U;

/* ---------- roofs ---------- */
/** flat roof with a parapet rim. Returns the usable floor rect {x0,x1,y0,y1,z}. wall = parapet colour. o:{ph,t,roof,cap,l,r} */
export function flatRoof(x, y, z, w, d, wall, o = {}) {
  const ph = o.ph === undefined ? .3 : o.ph, t = o.t === undefined ? .2 : o.t, rc = o.roof || '#8d8884', cap = o.cap || lt(wall, .3);
  box(x, y, z, w, d, ph, wall, { t: cap, l: o.l, r: o.r });
  const x0 = x + t, x1 = x + w - t, y0 = y + t, y1 = y + d - t, sn = winter();
  fq([[x0, y0, z], [x1 - ph, y0, z], [x1, y0, z + ph], [x0, y0, z + ph]], dk(wall, .3));
  fq([[x0, y0, z], [x0, y1 - ph, z], [x0, y1, z + ph], [x0, y0, z + ph]], dk(wall, .48));
  qz(x0, x1 - ph, y0, y1 - ph, z, sn ? SNOW : rc);
  if (sn) { qz(x0, x1 - ph, y0, y0 + .3, z, SNOW2, SNOW); qz(x0, x0 + .3, y0, y1 - ph, z, SNOW2, SNOW); qz(x, x + w, y + d - t, y + d, z + ph, SNOW); qz(x + w - t, x + w, y, y + d, z + ph, SNOW); }
  else { qz(x0, x1 - ph, y0, y0 + .2, z, dk(rc, .25)); qz(x0, x0 + .2, y0, y1 - ph, z, dk(rc, .3)); }
  lw([x0, y1 - ph, z], [x1 - ph, y1 - ph, z], dk(wall, .55)); lw([x1 - ph, y0, z], [x1 - ph, y1 - ph, z], dk(wall, .55));
  return { x0: x0 + .2, x1: x1 - ph - .2, y0: y0 + .2, y1: y1 - ph - .2, z };
}
/** snow blanket on a flat top (winter only) */
export function snowTop(x0, x1, y0, y1, z, edge = .25) {
  if (!winter()) return;
  qz(x0, x1, y0, y1, z, SNOW, SNOW2); qz(x0 + edge, x1 - edge, y0 + edge, y1 - edge, z, SNOW);
}
/** snow on the visible slope of a gable() roof with the same args (winter only) */
export function gableSnow(x, y, z, w, d, h, axis, k = .8) {
  if (!winter()) return;
  if (axis === 'x') { const m = y + d / 2; fq([[x, m + d / 2 * k, z + h * (1 - k)], [x + w, m + d / 2 * k, z + h * (1 - k)], [x + w, m, z + h], [x, m, z + h]], SNOW); fq([[x, y + d + .1, z], [x + w, y + d + .1, z], [x + w, m + d / 2 * k, z + h * (1 - k)], [x, m + d / 2 * k, z + h * (1 - k)]], SNOW, 'glass'); }
  else { const m = x + w / 2; fq([[m + w / 2 * k, y, z + h * (1 - k)], [m + w / 2 * k, y + d, z + h * (1 - k)], [m, y + d, z + h], [m, y, z + h]], SNOW2); fq([[x + w + .1, y, z], [x + w + .1, y + d, z], [m + w / 2 * k, y + d, z + h * (1 - k)], [m + w / 2 * k, y, z + h * (1 - k)]], SNOW2, 'glass'); }
}
/** hemispherical dome, base centre (x,y,z), radius r. o:{k: height factor, ribs, snow} */
export function dome(x, y, z, r, c, o = {}) {
  const s = PW(x, y, z), rx = r * U * 1.414, ry = rx / 2, rt = r * U * (o.k || 1.05), p = pal(c), sn = winter() && o.snow !== false;
  const cs = [C(lt(c, .35)), C(c), C(p.l), C(p.r)], oc = C(p.o), cw = C(SNOW), fl = isFlipped() ? -1 : 1;
  for (let X = Math.ceil(s[0] - rx); X <= Math.floor(s[0] + rx); X++) {
    const k = (X - s[0]) / rx, e = Math.sqrt(Math.max(0, 1 - k * k)), yt = Math.round(s[1] - rt * e), yb = Math.round(s[1] + ry * e);
    for (let Y = yt; Y <= yb; Y++) {
      const n = Y < s[1] ? (s[1] - Y) / rt : -(Y - s[1]) / ry * .5, li = -k * fl * .55 + n * .6 + (((X + Y) & 1) ? .05 : -.05);
      let ci = li > .62 ? 0 : li > .12 ? 1 : li > -.3 ? 2 : 3;
      if (o.ribs && Math.abs(((k * fl * .5 + .5) * o.ribs) % 1 - .5) > .46 && Y < s[1]) ci = Math.min(3, ci + 1);
      px(X, Y, sn && n > .72 + (((X + Y) & 1) ? .08 : 0) ? cw : cs[ci]);
    }
    px(X, yt - 1, oc); px(X, yb + 1, oc);
  }
  for (let Y = Math.round(s[1] - 2); Y <= Math.round(s[1] + 2); Y++) { px(Math.ceil(s[0] - rx) - 1, Y, oc); px(Math.floor(s[0] + rx) + 1, Y, oc); }
}
/** flat disc on the ground plane (world circle of radius r) */
export function disc(x, y, z, r, h, h2) { const s = PW(x, y, z), rx = r * U * 1.414; ellipse(s[0], s[1], rx, rx / 2, h, h2); }
/** barrel vault roof over footprint, axis along x, springing at z, rise h. cap = end-wall colour (or pattern) */
export function vault(x, y, z, w, d, h, c, o = {}) {
  const n = 12, sn = winter(), P = t => [y + d * t, z + h * Math.sin(Math.PI * t)];
  if (o.cap !== false) { const pts = []; for (let i = 0; i <= n; i++) { const q = P(i / n); pts.push([x + w, q[0], q[1]]); } fq(pts, o.cap || dk(c, .36), o.cap2); }
  for (let i = 0; i < n; i++) {
    const a = P(i / n), b = P((i + 1) / n), t = (i + .5) / n;
    const col = sn && t > .2 && t < .8 ? (t > .3 && t < .7 ? SNOW : SNOW2) : t < .25 ? dk(c, .5) : t < .45 ? dk(c, .15) : t < .62 ? lt(c, .3) : t < .82 ? c : dk(c, .16);
    fq([[x, a[0], a[1]], [x + w, a[0], a[1]], [x + w, b[0], b[1]], [x, b[0], b[1]]], col);
  }
  const oc = dk(c, .7);
  for (let i = 0; i < n; i++) { const a = P(i / n), b = P((i + 1) / n); lw([x + w, a[0], a[1]], [x + w, b[0], b[1]], oc); if (i / n < .5) lw([x, a[0], a[1]], [x, b[0], b[1]], oc); }
  lw([x, y + d, z], [x + w, y + d, z], oc);
  if (o.ribs) for (let xr = x + o.ribs; xr < x + w - .1; xr += o.ribs) for (let i = 3; i < n; i++) { const a = P(i / n), b = P((i + 1) / n); lw([xr, a[0], a[1]], [xr, b[0], b[1]], dk(c, .3)); }
}

/* ---------- windows & doors ---------- */
/** one window. o: winY opts + {trim: hex, arch: bool, curtain: hex, shutter: hex, fbox: bool} */
export function win(side, a0, a1, pl, z0, z1, o = {}) {
  if (o.trim) Q(side, a0 - .1, a1 + .1, pl, z0 - .1, z1 + .1, o.trim);
  if (o.shutter) { Q(side, a0 - .32, a0 - .04, pl, z0, z1, o.shutter); Q(side, a1 + .04, a1 + .32, pl, z0, z1, o.shutter); }
  if (o.arch) {
    const m = (a0 + a1) / 2, rr = (a1 - a0) / 2, ah = o.archH || rr * .9, pts = [], po = [];
    for (let i = 0; i <= 8; i++) { const t = Math.PI * i / 8; pts.push(P3(side, m - rr * Math.cos(t), pl, z1 + ah * Math.sin(t))); po.push(P3(side, m - (rr + .1) * Math.cos(t), pl, z1 + (ah + .1) * Math.sin(t))); }
    if (o.trim) fq(po, o.trim);
    const g = o.glass || (side === 'y' ? ['#7fb6d0', '#9fcbe0'] : ['#6aa2bd', '#86bcd2']);
    fq(pts, g[0], g[1]); if (o.on !== false) glow(() => fq(pts, (o.glowc || ['#ffd98a', '#f4c870'])[0], (o.glowc || ['#ffd98a', '#f4c870'])[1]));
    const fr = o.frame || '#4a4458'; for (let i = 0; i < 8; i++) lw(pts[i], pts[i + 1], fr); lw(P3(side, m, pl, z1), P3(side, m, pl, z1 + ah), fr);
  }
  (side === 'y' ? winY(a0, a1, pl, z0, z1, o) : winX(pl, a0, a1, z0, z1, o));
  if (o.curtain) { const k = () => { Q(side, a0 + .06, a1 - .06, pl, z1 - .3, z1 - .05, o.curtain); }; k(); if (o.on !== false) glow(() => Q(side, a0 + .06, a1 - .06, pl, z1 - .3, z1 - .05, lt(o.curtain, .3))); }
  if (o.blind) { const zb = z1 - (z1 - z0) * o.blind; Q(side, a0 + .06, a1 - .06, pl, zb, z1 - .05, '#e6e0d2'); if (o.on !== false) glow(() => Q(side, a0 + .06, a1 - .06, pl, zb, z1 - .05, '#fff0c8')); }
  if (o.fbox) { Q(side, a0 - .05, a1 + .05, pl, z0 - .22, z0 - .04, '#7a5236'); const f = foliage('leaf', a0) || SNOW; for (let a = a0; a < a1; a += .19) L(side, a, z0 + .02, a + .08, z0 + .1, pl, f); L(side, a0, z0 - .03, a1, z0 - .03, pl, f); }
}
/** evenly spaced row of windows across a0..a1. o: win opts + {ww, gap, n, r: rng, p: on-probability, each: (i,a)=>opts} */
export function wins(side, a0, a1, pl, z0, z1, o = {}) {
  const ww = o.ww || .9, gap = o.gap === undefined ? .7 : o.gap, n = o.n || Math.max(1, Math.floor((a1 - a0 + gap) / (ww + gap))), sp = (a1 - a0 - n * ww) / n;
  for (let i = 0; i < n; i++) {
    const a = snap(a0 + sp / 2 + i * (ww + sp)), e = o.each ? o.each(i, a) : null; if (e === false) continue;
    win(side, a, a + ww, pl, z0, z1, Object.assign({}, o, { on: o.r ? o.r() < (o.p === undefined ? .55 : o.p) : o.on }, e));
  }
}
/** door centred at c0 on a wall. o:{w,h,c,frame,glass,double,full,z,transom,on} */
export function door(side, c0, pl, o = {}) {
  const w = o.w || (o.double ? 1.6 : .9), h = o.h || 1.6, c = o.c || '#5a3b2a', fr = o.frame || lt(c, .45), z = o.z || 0;
  Q(side, c0 - w / 2 - .12, c0 + w / 2 + .12, pl, z, z + h + .12 + (o.transom ? .4 : 0), fr);
  if (o.transom) win(side, c0 - w / 2, c0 + w / 2, pl, z + h + .1, z + h + .42, { on: true, mullion: o.double ? 'v' : null });
  Q(side, c0 - w / 2, c0 + w / 2, pl, z, z + h, c);
  const gl = (a, b) => win(side, a, b, pl, z + (o.full ? .18 : .78), z + h - .14, { on: o.on !== false, frame: dk(c, .45), glowc: o.glowc });
  if (o.glass !== false) { if (o.double) { gl(c0 - w / 2 + .1, c0 - .06); gl(c0 + .06, c0 + w / 2 - .1); } else gl(c0 - w / 2 + .14, c0 + w / 2 - .14); }
  else { L(side, c0 - w / 2 + .14, z + .2, c0 - w / 2 + .14, z + h - .2, pl, dk(c, .3)); L(side, c0 + w / 2 - .14, z + .2, c0 + w / 2 - .14, z + h - .2, pl, dk(c, .3)); }
  if (o.double) L(side, c0, z, c0, z + h, pl, dk(c, .55));
  const hc = o.handle || '#f2d98a';
  if (o.double) { L(side, c0 - .1, z + .7, c0 - .1, z + .9, pl, hc); L(side, c0 + .1, z + .7, c0 + .1, z + .9, pl, hc); }
  else L(side, c0 + w / 2 - .12, z + .72, c0 + w / 2 - .12, z + .86, pl, hc);
  L(side, c0 - w / 2, z, c0 - w / 2, z + h, pl, dk(c, .6)); L(side, c0 + w / 2, z, c0 + w / 2, z + h, pl, dk(c, .6)); L(side, c0 - w / 2, z + h, c0 + w / 2, z + h, pl, dk(c, .6));
}
/** roll-up / garage door */
export function shutter(side, a0, a1, pl, z0, z1, c, o = {}) {
  Q(side, a0 - .1, a1 + .1, pl, z0, z1 + .12, o.frame || dk(c, .45)); Q(side, a0, a1, pl, z0, z1, PAT.siding(side === 'y' ? c : dk(c, .15), o.step || 3));
  if (o.wins) wins(side, a0 + .15, a1 - .15, pl, z0 + (z1 - z0) * .55, z0 + (z1 - z0) * .8, { ww: .5, gap: .25, on: o.on, r: o.r, p: o.p });
}
/** sloped striped awning on a +y wall from x0..x1, top edge at z+drop on the wall, front edge at z. */
export function awning(x0, x1, y, z, o = {}) {
  const dep = o.dep || .7, drop = o.drop === undefined ? .4 : o.drop, c1 = o.c || '#c8423a', c2 = o.c2 || '#f4f0e8', st = o.stripe || .5;
  let i = 0; for (let x = x0; x < x1 - 1e-6; x += st, i++) { const xe = Math.min(x1, x + st); fq([[x, y, z + drop], [xe, y, z + drop], [xe, y + dep, z], [x, y + dep, z]], i % 2 ? c2 : c1); }
  fq([[x1, y, z + drop], [x1, y + dep, z], [x1, y + dep, z - .16], [x1, y, z - .16]], dk(c1, .4));
  i = 0; for (let x = x0; x < x1 - 1e-6; x += st, i++) qy(x, Math.min(x1, x + st), y + dep, z - .16, z, dk(i % 2 ? c2 : c1, .2));
  if (winter()) fq([[x0, y, z + drop], [x1, y, z + drop], [x1, y + dep * .5, z + drop * .5], [x0, y + dep * .5, z + drop * .5]], SNOW, 'glass');
  const oc = dk(c1, .65); lw([x0, y + dep, z - .16], [x1, y + dep, z - .16], oc); lw([x0, y, z + drop], [x0, y + dep, z], oc); lw([x0, y + dep, z], [x0, y + dep, z - .16], oc); lw([x1, y + dep, z - .16], [x1, y, z - .16], oc); lw([x0, y + dep, z], [x1, y + dep, z], dk(c1, .3));
}
/** flat canopy slab projecting from a +y wall, with optional posts and a glowing soffit */
export function canopy(x0, x1, y, z, dep, c, o = {}) {
  if (o.posts) for (const xp of o.posts) box(xp - .08, y + dep - .25, 0, .16, .16, z, o.postc || '#5a5f68', { ol: false });
  box(x0, y, z, x1 - x0, dep, o.th || .18, c, o.box);
  if (o.soffit !== false) glow(() => { qy(x0 + .1, x1 - .1, y + dep, z - .08, z, '#ffe9b0'); });
  snowTop(x0, x1, y, y + dep, z + (o.th || .18) + .001, .1);
}
/** row of marquee bulbs along a wall segment (lit day & night) */
export function bulbs(side, a0, a1, pl, z, o = {}) {
  const st = o.step || .25, cs = o.cols || ['#fff2a8', '#ffb347']; let i = 0;
  lit(() => { for (let a = a0; a <= a1 + 1e-6; a += st, i++) { const p = PW(...P3(side, a, pl, z)); px(Math.round(p[0]), Math.round(p[1]), C(cs[i % cs.length])); } });
}
/** vertical row of bulbs */
export function bulbsV(side, a, pl, z0, z1, o = {}) { const st = o.step || .25, cs = o.cols || ['#fff2a8', '#ffb347']; let i = 0; lit(() => { for (let z = z0; z <= z1 + 1e-6; z += st, i++) { const p = PW(...P3(side, a, pl, z)); px(Math.round(p[0]), Math.round(p[1]), C(cs[i % cs.length])); } }); }
/** neon polyline in wall coords [[a,z],...] */
export function neon(side, pts, pl, col, o = {}) { lit(() => { for (let i = 0; i < pts.length - 1; i++) L(side, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], pl, col); }); if (o.halo) glow(() => { for (let i = 0; i < pts.length - 1; i++) L(side, pts[i][0], pts[i][1] - 1 / U, pts[i + 1][0], pts[i + 1][1] - 1 / U, pl, dk(col, .35)); }); }
/** soft halo that only shows at night */
export function halo(x, y, z, rpx, col = '#ffe9b0') { glow(() => { const p = PW(x, y, z); ellipse(p[0], p[1], rpx, rpx, col, 'glass'); }); }
/** small wall lamp */
export function lamp(side, a, pl, z, col = '#fff2c4') { const q = P3(side, a, pl, z); const p = PW(...q); glow(() => ellipse(p[0], p[1] + 2, 3.5, 3.5, col, 'glass')); L(side, a - .06, z + .1, a + .06, z + .1, pl, '#3d4a54'); lit(() => { px(Math.round(p[0]), Math.round(p[1]), C(col)); px(Math.round(p[0]), Math.round(p[1]) + 1, C(col)); }); }

/* ---------- classical bits ---------- */
export function column(x, y, z, h, r, c) {
  box(x - r - .08, y - r - .08, z, 2 * r + .16, 2 * r + .16, .14, c, { ol: false });
  cyl(x, y, z + .14, r, h - .3, c, { ol: false, l: lt(c, .12), r: dk(c, .22) });
  const a = PW(x, y, z + .14), b = PW(x, y, z + h - .16); for (let Y = Math.round(b[1]); Y <= Math.round(a[1]); Y++) { px(Math.round(a[0] - r * U * 1.414) - 0, Y, C(dk(c, .1))); }
  box(x - r - .1, y - r - .1, z + h - .16, 2 * r + .2, 2 * r + .2, .16, lt(c, .1), { ol: false });
}
/** steps descending toward +y from y0 (top step first). top height = n*rise */
export function stairs(x0, x1, y0, n, c, o = {}) {
  const dep = o.dep || .4, rise = o.rise || .2, z = o.z || 0;
  for (let i = 0; i < n; i++) { box(x0, y0 + i * dep, z, x1 - x0, dep, (n - i) * rise, c, { ol: false, t: winter() && i % 2 === 0 ? mix(c, SNOW, .6) : lt(c, .12) }); }
  lw([x0, y0 + n * dep, z], [x1, y0 + n * dep, z], dk(c, .6)); lw([x1, y0, z], [x1, y0 + n * dep, z], dk(c, .6));
}
/** triangular pediment standing on a +y facing plane: base x0..x1 at z, apex height h */
export function pediment(x0, x1, y, z, h, c, o = {}) {
  const m = (x0 + x1) / 2; fq([[x0, y, z], [x1, y, z], [m, y, z + h]], dk(c, .12));
  const inn = .28; fq([[x0 + inn * 2.2, y, z + .14], [x1 - inn * 2.2, y, z + .14], [m, y, z + h - inn]], o.inner || dk(c, .28));
  lw([x0, y, z], [m, y, z + h], dk(c, .6)); lw([x1, y, z], [m, y, z + h], dk(c, .6)); lw([x0, y, z], [x1, y, z], lt(c, .3));
}
/** hanging banner on a +y wall */
export function banner(side, a, pl, z0, z1, w, c, o = {}) {
  const c2 = o.c2 || lt(c, .55);
  Q(side, a, a + w, pl, z0 + .25, z1, c);
  fq([P3(side, a, pl, z0 + .25), P3(side, a + w, pl, z0 + .25), P3(side, a + w / 2, pl, z0)], c);
  Q(side, a, a + w, pl, z1 - .28, z1 - .14, c2); Q(side, a, a + w, pl, z0 + .4, z0 + .5, c2);
  if (o.emblem !== false) { const m = (z0 + z1) / 2 + .1; fq([P3(side, a + w / 2, pl, m + .3), P3(side, a + w - .12, pl, m), P3(side, a + w / 2, pl, m - .3), P3(side, a + .12, pl, m)], c2); }
  L(side, a - .08, z1, a + w + .08, z1, pl, '#4a4458'); L(side, a, z0 + .25, a, z1, pl, dk(c, .45)); L(side, a + w, z0 + .25, a + w, z1, pl, dk(c, .45));
}
export function flag(x, y, z, h, c, c2) {
  lw([x, y, z], [x, y, z + h], '#c9ccd2'); fq([[x, y, z + h], [x + .9, y, z + h - .1], [x + .9, y, z + h - .6], [x, y, z + h - .55]], c); if (c2) fq([[x, y, z + h - .2], [x + .9, y, z + h - .28], [x + .9, y, z + h - .42], [x, y, z + h - .36]], c2);
  const p = PW(x, y, z + h); px(Math.round(p[0]), Math.round(p[1]) - 1, C('#f2d98a'));
}

/* ---------- plants ---------- */
export function bush(x, y, z, r, v = 0) { const f = foliage('leaf', v) || '#b9c8cf'; ball(x, y, z + r * .7, r, f, { squash: .75 }); if (winter()) { const p = PW(x, y, z + r * 1.3); ellipse(p[0] - 1, p[1] + 1, r * U * .7, r * U * .35, SNOW); } }
export function topiary(x, y, z, v = 0) { box(x - .3, y - .3, z, .6, .6, .45, '#8a6f5a', { ol: true }); const f = foliage('pine', v); ball(x, y, z + 1.0, .5, f); if (winter()) { const p = PW(x, y, z + 1.45); ellipse(p[0], p[1], 5, 3, SNOW); } }
export function planter(x, y, z, w, d, v = 0, c = '#8d8884') { box(x, y, z, w, d, .4, c); const f = foliage('leaf', v) || '#b9c8cf', n = Math.max(1, Math.round(Math.max(w, d) / .6)); for (let i = 0; i < n; i++) { const t = (i + .5) / n; ball(x + (w > d ? w * t : w / 2), y + (w > d ? d / 2 : d * t), z + .6, .32, i % 2 ? f : dk(f, .1), { squash: .8 }); } if (winter()) qz(x + .1, x + w - .1, y + .1, y + d - .1, z + .85, SNOW, 'glass'); }

/* ---------- rooftop kit (x,y = min corner of a ~1.2 cell) ---------- */
export const ROOF = {
  ac(x, y, z) { box(x, y, z, 1.0, .8, .55, '#b9bec4'); disc(x + .5, y + .4, z + .56, .2, '#5d646e'); disc(x + .5, y + .4, z + .56, .07, '#9aa0a8'); for (let k = .12; k < .5; k += .12) lw([x + .08, y + .8, z + k], [x + .92, y + .8, z + k], '#8d939b'); snowTop(x, x + 1, y, y + .8, z + .56, .1); if (winter()) disc(x + .5, y + .4, z + .56, .16, '#5d646e'); },
  ac2(x, y, z) { box(x, y, z, 1.3, 1.0, .7, '#a9b0b8'); disc(x + .38, y + .5, z + .71, .2, '#555c66'); disc(x + .92, y + .5, z + .71, .2, '#555c66'); qy(x + .1, x + 1.2, y + 1, z + .15, z + .55, PAT.siding('#8d939b', 2)); box(x + .3, y + 1, z + .1, .12, .3, .12, '#6f757d', { ol: false }); },
  vent(x, y, z) { cyl(x + .5, y + .5, z, .15, .4, '#9aa0a8'); cyl(x + .5, y + .5, z + .4, .24, .1, '#7d838b'); },
  pipe(x, y, z) { box(x + .3, y + .3, z, .25, .25, .9, '#8a7a72'); box(x + .25, y + .25, z + .9, .35, .35, .1, '#6f625c', { ol: false }); },
  tank(x, y, z) { for (const [a, b] of [[.2, .2], [1, .2], [.2, 1], [1, 1]]) box(x + a - .05, y + b - .05, z, .1, .1, .6, '#5a4a40', { ol: false }); cyl(x + .6, y + .6, z + .55, .55, 1.0, '#9a6a44', { l: '#a87850', r: '#7d5436' }); const p = PW(x + .6, y + .6, z + 1.0); for (const dy of [0, 5, -6]) for (let X = -11; X <= 11; X++) px(Math.round(p[0]) + X, Math.round(p[1] + dy + Math.sqrt(Math.max(0, 1 - X * X / 150)) * 6), C('#5a4030')); cone(x + .6, y + .6, z + 1.55, .65, .55, winter() ? SNOW2 : '#6b5a52'); },
  sky(x, y, z, r) { box(x, y, z, 1.2, 1.0, .2, '#d8d4cc'); qz(x + .1, x + 1.1, y + .1, y + .9, z + .21, '#8fc4dc', '#a8d4e6'); if (!r || r() < .6) glow(() => qz(x + .1, x + 1.1, y + .1, y + .9, z + .21, '#ffe2a0', '#f4c870')); lw([x + .6, y + .1, z + .21], [x + .6, y + .9, z + .21], '#f0ece4'); },
  dish(x, y, z) { box(x + .45, y + .45, z, .1, .1, .5, '#6f757d', { ol: false }); const p = PW(x + .5, y + .5, z + .75); ellipse(p[0], p[1], 6, 6, '#d8dce0'); ellipse(p[0] + 1, p[1] + 1, 4, 4, '#b4bac2'); px(p[0] - 1, p[1] - 1, C('#6f757d')); },
  solar(x, y, z) { for (const k of [0, .65]) { fq([[x + k, y, z + .5], [x + k + .55, y, z + .5], [x + k + .55, y + 1, z + .1], [x + k, y + 1, z + .1]], winter() ? SNOW2 : '#2f4f8a'); lw([x + k, y + .5, z + .3], [x + k + .55, y + .5, z + .3], '#7fa4d8'); lw([x + k, y, z + .5], [x + k + .55, y, z + .5], '#c9d4e0'); lw([x + k + .55, y, z + .5], [x + k + .55, y + 1, z + .1], '#1f2f55'); lw([x + k, y + 1, z + .1], [x + k + .55, y + 1, z + .1], '#1f2f55'); } },
  hatch(x, y, z) { box(x, y, z, 1.1, 1.1, 1.3, '#a59c92', { t: winter() ? SNOW : '#7d756e' }); qy(x + .3, x + .8, y + 1.1, z, z + 1.05, '#5d646e'); lw([x + .7, y + 1.1, z + .5], [x + .7, y + 1.1, z + .6], '#f2d98a'); },
  garden(x, y, z, r) { box(x, y, z, 1.2, .9, .3, '#7a5236'); const f = foliage('leaf', r ? r() : .3) || '#b9c8cf'; ball(x + .3, y + .45, z + .5, .3, f, { squash: .8 }); ball(x + .8, y + .45, z + .55, .34, dk(f, .1), { squash: .8 }); if (ENV.season < 2) { const p = PW(x + .5, y + .5, z + .8); px(p[0], p[1], C('#f7c1d4')); px(p[0] + 5, p[1] + 2, C('#ffe27a')); px(p[0] - 5, p[1] + 3, C('#f2a7c3')); } },
  antenna(x, y, z) { lw([x + .5, y + .5, z], [x + .5, y + .5, z + 2.2], '#5d646e'); lw([x + .2, y + .5, z + 1.6], [x + .8, y + .5, z + 1.6], '#5d646e'); lw([x + .3, y + .5, z + 1.9], [x + .7, y + .5, z + 1.9], '#5d646e'); const p = PW(x + .5, y + .5, z + 2.2); lit(() => px(Math.round(p[0]), Math.round(p[1]), C('#ff5a4a'))); },
  chairs(x, y, z) { box(x + .1, y + .2, z, .5, .5, .35, '#d9a441', { ol: false }); box(x + .7, y + .4, z, .4, .4, .3, '#3f8fb0', { ol: false }); lw([x + .9, y + .6, z + .3], [x + .9, y + .6, z + 1.3], '#e8e2d4'); fq([[x + .4, y + .6, z + 1.2], [x + 1.4, y + .6, z + 1.2], [x + .9, y + .6, z + 1.6]], '#e2574c'); },
};
/** scatter n rooftop items over a rect (from flatRoof). kinds = names in ROOF. Back-to-front safe. */
export function clutter(r, f, kinds, n) {
  const cs = 1.5, nx = Math.floor((f.x1 - f.x0) / cs), ny = Math.floor((f.y1 - f.y0) / cs); if (nx < 1 || ny < 1) return;
  const cells = []; for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) cells.push([i, j, r()]);
  cells.sort((a, b) => a[2] - b[2]); const use = cells.slice(0, Math.min(n, cells.length)).sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
  const sx = (f.x1 - f.x0) / nx, sy = (f.y1 - f.y0) / ny;
  for (const c of use) { const k = pick(r, kinds); ROOF[k](snap(f.x0 + c[0] * sx + r() * Math.max(0, sx - 1.3)), snap(f.y0 + c[1] * sy + r() * Math.max(0, sy - 1.2)), f.z, r); }
}

/* ---------- murals: pattern fns (u,v,w,h) for qy/qx ---------- */
const PALS = [
  ['#f25c54', '#f7b267', '#f4845f', '#70c1b3', '#247ba0', '#fff3d6'],
  ['#5b5fc7', '#f15bb5', '#fee440', '#00bbf9', '#00f5d4', '#fff8e8'],
  ['#2a9d8f', '#e9c46a', '#f4a261', '#e76f51', '#264653', '#fdf6e3'],
  ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#9b5de5', '#fff8e8'],
  ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#3a3070', '#fffaf0'],
];
export const muralPal = s => PALS[Math.abs(s | 0) % PALS.length];
export const MURALS = {
  sun: (P) => (u, v, w, h) => { const dx = u - w / 2, r = Math.hypot(dx, v), R = Math.min(h * .42, w * .28); if (r < R - 2) return (r < R * .55) ? P[1] : (((u + v) & 1) ? P[1] : P[0]); if (r < R) return P[5]; const a = Math.atan2(v, dx); return (Math.floor(a / Math.PI * 14) & 1) ? P[3] : P[4]; },
  waves: (P) => (u, v, w, h) => { const b = h / 6, t = v + Math.sin(u / 7) * 3 + Math.sin(u / 19 + 1) * 4, k = Math.floor(t / b), f = t - k * b; if (f < 1.2) return P[5]; return P[[4, 3, 4, 3, 1, 0][Math.max(0, Math.min(5, k))]]; },
  geo: (P) => (u, v) => { const s = 12, i = Math.floor(u / s), j = Math.floor(v / s), fu = u - i * s, fv = v - j * s, up = ((i + j) & 1) ? fu + fv < s : fu < fv; return P[Math.floor(hash2(i, j, up ? 3 : 8) * 5)]; },
  rainbow: (P) => (u, v, w, h) => { const R = Math.min(w * .46, h * .86), r = Math.hypot(u - w / 2, v - 2), k = Math.floor((R - r) / Math.max(3, R * .11)); if (r <= R && k < 5) return [P[0], P[2], P[1], P[3], P[4]][k]; const cl = (cx, cy, cr) => Math.hypot((u - cx) * .6, v - cy) < cr; if (cl(w / 2 - R * .8, 5, 7) || cl(w / 2 + R * .8, 5, 7) || cl(w / 2 - R * .8 + 8, 9, 5) || cl(w / 2 + R * .8 - 8, 9, 5)) return P[5]; return hash2(u >> 1, v >> 1, 5) > .97 ? P[5] : '#8fd3e8'; },
  skyline: (P) => (u, v, w, h) => { const i = Math.floor(u / 9), bh = h * (.22 + .42 * hash2(i, 3, 11)); if (v < bh) { const fu = u - i * 9; return (fu > 1 && fu < 7 && fu % 2 === 0 && v % 4 === 2 && hash2(u, v >> 2, 5) > .45) ? '#ffe27a' : (i & 1 ? '#2b2a55' : '#3a3070'); } const mx = w * .72, my = h * .78; if (Math.hypot(u - mx, v - my) < 6) return '#fff3d6'; const t = v / h; return t > .8 ? '#3d3b8e' : t > .62 ? (((u + v) & 1) && t < .68 ? '#b5508f' : '#6a4c9c') : t > .45 ? '#e0607e' : '#f7b267'; },
  hills: (P) => (u, v, w, h) => { const sun = Math.hypot(u - w * .3, v - h * .7); if (v < h * .22 + Math.sin(u / 11) * 4) return P[4]; if (v < h * .4 + Math.sin(u / 16 + 2) * 6) return P[3]; if (v < h * .55 + Math.sin(u / 23 + 4) * 7) return mix(P[3], P[5], .45); if (sun < 8) return P[1]; if (sun < 10) return P[5]; return (Math.floor(v / 3) & 1) ? P[2] : P[1]; },
  bubbles: (P) => (u, v) => { const s = 18, i = Math.floor(u / s), j = Math.floor(v / s); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const cx = (i + a + .5) * s + (hash2(i + a, j + b, 1) - .5) * 10, cy = (j + b + .5) * s + (hash2(i + a, j + b, 2) - .5) * 10, R = 5 + hash2(i + a, j + b, 4) * 6, d = Math.hypot(u - cx, v - cy); if (d < R) return d < R * .45 ? P[5] : P[Math.floor(hash2(i + a, j + b, 6) * 4)]; } return P[4]; },
  memphis: (P) => (u, v) => { const s = 14, i = Math.floor(u / s), j = Math.floor(v / s), fu = u - i * s, fv = v - j * s, k = Math.floor(hash2(i, j, 9) * 5), c = P[Math.floor(hash2(i, j, 4) * 5)]; if (k === 0 && Math.hypot(fu - 7, fv - 7) < 4) return c; if (k === 1 && Math.abs(fv - 7 - (Math.abs((fu % 6) - 3) - 1.5) * 1.6) < 1.2 && fu > 1) return c; if (k === 2 && fv > 3 && fv < 11 && Math.abs(fu - 7) < (11 - fv) * .6) return c; if (k === 3 && (Math.abs(fu - 7) < 1.2 || Math.abs(fv - 7) < 1.2) && Math.abs(fu - 7) < 4.5 && Math.abs(fv - 7) < 4.5) return c; if (k === 4 && (fu + fv) % 5 < 1.6 && fu > 2 && fu < 12 && fv > 3 && fv < 11) return c; return P[5]; },
  flower: (P) => (u, v, w, h) => { const cx = w / 2, cy = h * .62, dx = u - cx, dy = v - cy, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx), R = Math.min(w, h) * .34; if (r < R * .3) return ((u + v) & 1) ? P[1] : P[2]; if (r < R * (.62 + .38 * Math.cos(a * 7))) return (r < R * .55) ? P[0] : mix(P[0], P[5], .35); if (Math.abs(dx + Math.sin(v / 6) * 2) < 2 && v < cy) return '#2f7d4f'; const lf = Math.hypot((u - cx - 9) * .5, v - h * .22); if (lf < 4 || Math.hypot((u - cx + 9) * .5, v - h * .3) < 4) return '#3f9a5f'; return ((u + v * 2) % 16 < 2) ? mix(P[3], P[5], .5) : P[3]; },
  diag: (P) => (u, v) => P[Math.floor((u + v) / 9) % 5],
};
export const MURAL_KINDS = Object.keys(MURALS);
/** paint a mural on a wall rect */
export function mural(side, kind, a0, a1, pl, z0, z1, seed = 0) {
  const P = muralPal(seed), f = (MURALS[kind] || MURALS.geo)(P);
  Q(side, a0, a1, pl, z0, z1, side === 'y' ? f : (u, v, w, h) => { const c = f(u, v, w, h); return c ? dk(c, .16) : c; });
  const fr = '#3a3350'; L(side, a0, z0, a1, z0, pl, fr); L(side, a0, z1, a1, z1, pl, fr); L(side, a0, z0, a0, z1, pl, fr); L(side, a1, z0, a1, z1, pl, fr);
}
/** visual-bounds helper: size fn + extra margins */
export const VB = (size, ey = 1, ex = .5, ez = .5, e0 = .4) => p => { const s = typeof size === 'function' ? size(p || {}) : size; return [-e0, -e0, 0, s[0] + ex, s[1] + ey, s[2] + ez]; };
/** shorthand: floor band line + cornice strip around the two visible faces at height z */
export function band(w, d, z, c, th = .12) { qy(0, w, d, z, z + th, c); qx(w, 0, d, z, z + th, dk(c, .2)); lw([0, d, z], [w, d, z], dk(c, .45)); lw([w, 0, z], [w, d, z], dk(c, .5)); }
export function cornice(w, d, z, c, th = .2, out = .12) { box(-out, -out, z, w + 2 * out, d + 2 * out, th, c); }
