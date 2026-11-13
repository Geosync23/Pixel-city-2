// Shared helpers for the venue fixture libraries (src/art/venue/*). Not an asset module.
import { at, box, qy, qx, qz, lw, fq, glow, lit, ball, cyl, PW, px, C, rect, spx, hash2, dk, lt, mix, PAT, textY, signY, textW, U } from '../../engine/raster.js';

/** asset shorthand: F('grocery.bin', ['grocery','produce'], [w,d,h], draw, {extras}) */
export const F = (id, tags, size, draw, x) => Object.assign({ id: 'furn.' + id, kind: 'furniture', tags, size, draw }, x || {});
export const K = {
  wood: '#b07444', woodD: '#7a4e2d', woodL: '#d2a26a', woodR: '#8a4a34', steel: '#b8bcc0', steelD: '#7d858e', chrome: '#d5dbe0',
  white: '#f1ede4', cream: '#f4e9cf', dark: '#3a3f4c', black: '#2a2733', red: '#d63a3a', green: '#3f8a55', blue: '#3c64ad', sky: '#6fb6d8',
  yellow: '#f2c230', teal: '#2f8f8a', orange: '#e8843a', pink: '#e87aa0', purple: '#7a55b0', screen: '#1b2630', glass: '#a8dcea',
  card: '#c99a62', lime: '#9ccc4a', brass: '#d8a848', leaf: '#4f9a45', leafD: '#357a4a', terra: '#c0704a',
};
const P = 1 / 16;
export const PX = P;
/** box without outline */
export const bx = (x, y, z, w, d, h, c, o) => box(x, y, z, w, d, h, c, Object.assign({ ol: false }, o || {}));
/** 2px-thick world line */
export const tube = (a, b, c) => { lw(a, b, c); lw([a[0], a[1], a[2] + P], [b[0], b[1], b[2] + P], c); };
/** vertical post */
export const post = (x, y, z0, z1, c) => lw([x, y, z0], [x, y, z1], c);
export const posts = (x, y, w, d, z0, z1, c) => { post(x, y, z0, z1, c); post(x + w, y, z0, z1, c); post(x, y + d, z0, z1, c); post(x + w, y + d, z0, z1, c); };
/** rectangular frame on a y-plane / x-plane */
export const frameY = (x0, x1, y, z0, z1, c) => { lw([x0, y, z0], [x1, y, z0], c); lw([x0, y, z1], [x1, y, z1], c); lw([x0, y, z0], [x0, y, z1], c); lw([x1, y, z0], [x1, y, z1], c); };
export const frameX = (x, y0, y1, z0, z1, c) => { lw([x, y0, z0], [x, y1, z0], c); lw([x, y0, z1], [x, y1, z1], c); lw([x, y0, z0], [x, y0, z1], c); lw([x, y1, z0], [x, y1, z1], c); };
export const frameZ = (x0, x1, y0, y1, z, c) => { lw([x0, y0, z], [x1, y0, z], c); lw([x0, y1, z], [x1, y1, z], c); lw([x0, y0, z], [x0, y1, z], c); lw([x1, y0, z], [x1, y1, z], c); };

/** table with 4 legs: top slab at height h */
export function table(x, y, w, d, h, c, o) {
  o = o || {}; const lc = o.leg || dk(c, .45), i = o.inset === undefined ? .06 : o.inset, th = o.th || .1;
  posts(x + i, y + i, w - 2 * i, d - 2 * i, 0, h - th, lc);
  if (o.thick) { post(x + i + P, y + d - i, 0, h - th, lc); post(x + w - i, y + d - i - P, 0, h - th, lc); post(x + w - i, y + i + P, 0, h - th, lc); }
  box(x, y, h - th, w, d, th, c, o.top);
}
/** round pedestal table centred at x,y */
export function rtable(x, y, r, h, c, o) {
  o = o || {}; const lc = o.leg || '#4a4458';
  cyl(x, y, 0, r * .45, .04, lc, { ol: false }); tube([x, y, .04], [x, y, h - .06], lc); spx(x, y, .04, 1, 0, lc); 
  cyl(x, y, h - .07, r, .07, c, o.top);
}
/** chair on a .5x.5 footprint at min corner x,y. dir = way the sitter faces (0:+x 1:+y 2:-x 3:-y) */
export function chair(x, y, dir, c, o) {
  o = o || {}; const lc = o.leg || dk(c, .5), s = .4, a = x + .05, b = y + .05, sh = o.sh || .45, bh = o.bh || .95, sc = o.seat || c;
  const back = () => { if (dir === 1) bx(a, b, sh, s, .07, bh - sh, c); if (dir === 0) bx(a, b, sh, .07, s, bh - sh, c); if (dir === 3) bx(a, b + s - .07, sh, s, .07, bh - sh, c); if (dir === 2) bx(a + s - .07, b, sh, .07, s, bh - sh, c); };
  posts(a + .03, b + .03, s - .06, s - .06, 0, sh, lc);
  if (dir < 2) back();
  bx(a, b, sh - .08, s, s, .08, sc); 
  if (dir >= 2) back();
}
/** round stool centred at x,y */
export function stool(x, y, h, c, o) {
  o = o || {}; const lc = o.leg || '#8a9098';
  cyl(x, y, 0, .15, .03, lc, { ol: false }); tube([x, y, .03], [x, y, h - .08], lc);
  if (o.ring) cyl(x, y, h * .4, .13, .02, lc, { ol: false });
  cyl(x, y, h - .1, o.r || .19, .1, c, { ol: o.ol });
}
/** armchair / sofa: seat faces +y. w wide, d deep (~.9) */
export function sofa(x, y, w, d, c, o) {
  o = o || {}; const ch = o.cush || lt(c, .12);
  bx(x, y, .1, w, .22, .85, c); box(x, y, .1, w, d, .3, c); 
  bx(x + .16, y + .2, .4, w - .32, d - .22, .12, ch);
  const n = Math.max(1, Math.round((w - .3) / .8)); for (let i = 1; i < n; i++) { const xx = x + .16 + (w - .32) * i / n; lw([xx, y + .2, .52], [xx, y + d - .02, .52], dk(ch, .25)); lw([xx, y + d - .02, .52], [xx, y + d - .02, .4], dk(ch, .3)); }
  bx(x, y, .1, .16, d, .52, dk(c, .06)); bx(x + w - .16, y, .1, .16, d, .52, dk(c, .06));
  lw([x, y + .22, .95], [x + w, y + .22, .95], lt(c, .35));
  for (const [lx, ly] of [[x + .05, y + d - .03], [x + w - .03, y + d - .03], [x + w - .03, y + .05]]) post(lx, ly, 0, .1, '#4a3a30');
}
/** shop counter: body with toe-kick and overhanging top slab */
export function counter(x, y, w, d, h, c, top, o) {
  o = o || {}; top = top || lt(c, .35);
  box(x, y, 0, w, d, h - .08, c, o.body); 
  qy(x, x + w, y + d, 0, .08, dk(c, .55)); qx(x + w, y, y + d, 0, .08, dk(c, .65));
  if (o.panels !== false) { const n = Math.max(1, Math.round(w / (o.pw || .6))); for (let i = 0; i < n; i++) { const a = x + w * i / n + .07, b = x + w * (i + 1) / n - .07; frameY(a, b, y + d, .18, h - .2, dk(c, .34)); lw([a, y + d, h - .2 - P], [b, y + d, h - .2 - P], lt(c, .12)); } }
  if (o.stripe) qy(x, x + w, y + d, h - .2, h - .12, o.stripe);
  box(x - .04, y - .02, h - .08, w + .08, d + .08, .08, top, o.top);
}
/** cash register: body + keypad + small customer display. sits on a counter top at z */
export function till(x, y, z, o) {
  o = o || {}; const c = o.c || '#4a4f5c';
  box(x, y, z, .34, .3, .12, c); bx(x + .02, y, z + .12, .3, .14, .16, dk(c, .1));
  lit(() => { qy(x + .05, x + .29, y + .14, z + .15, z + .25, '#9cf2b0'); });
  lw([x + .08, y + .14, z + .2], [x + .2, y + .14, z + .2], '#2a6a48');
  qz(x + .04, x + .3, y + .17, y + .28, z + .12, '#cfd4da', '#8a9098');
}
/** flat monitor facing +y, standing on a surface at z. w ~ .45 */
export function monitor(x, y, z, w, h, o) {
  o = o || {}; const sc = o.scr || '#3a6ea5', fc = o.frame || '#2a2733';
  tube([x + w / 2, y + .03, z], [x + w / 2, y + .03, z + .1], fc); bx(x + w / 2 - .1, y - .02, z, .2, .12, .02, fc);
  bx(x, y, z + .08, w, .05, h, fc);
  lit(() => { qy(x + P, x + w - P, y + .05, z + .08 + P, z + .08 + h - P, sc, o.scr2); screenLines(x + 2 * P, x + w - 2 * P, y + .05, z + .08 + 2 * P, z + .08 + h - 2 * P, o.ink || lt(sc, .6), o.seed || 1); });
}
/** a few "text" lines on a y-plane region */
export function screenLines(x0, x1, y, z0, z1, c, seed) {
  let i = 0; for (let z = z1 - P; z > z0; z -= 2 * P, i++) { const k = hash2(i, seed, 5); lw([x0, y, z], [x0 + (x1 - x0) * (.45 + k * .55) - P, y, z], c); }
}
/** keyboard on a surface */
export const keyboard = (x, y, z) => { qz(x, x + .34, y, y + .12, z, '#d8dade', '#b8bcc4'); };
/** potted plant centred x,y. s = size ~1 */
export function plant(x, y, z, s, o) {
  o = o || {}; s = s || 1; const pc = o.pot || K.terra, lf = o.leaf || K.leaf;
  cyl(x, y, z, .16 * s, .26 * s, pc, { t: '#4a3a30' }); cyl(x, y, z + .26 * s, .18 * s, .04, lt(pc, .15), { ol: false, t: '#4a3a30' });
  const zz = z + .3 * s;
  if (o.kind === 'palm') { post(x, y, zz, zz + .7 * s, '#6b4a2f'); for (const [dx, dy, dz] of [[-.35, 0, .1], [.35, 0, .1], [0, -.35, .15], [0, .35, .05], [-.25, .25, .3], [.25, -.25, .3], [.25, .25, .2], [-.25, -.25, .3]]) { tube([x, y, zz + .7 * s], [x + dx * s * .6, y + dy * s * .6, zz + (.75 + dz * .6) * s], lf); tube([x + dx * s * .6, y + dy * s * .6, zz + (.75 + dz * .6) * s], [x + dx * s, y + dy * s, zz + (.45 + dz) * s], dk(lf, .12)); } return; }
  if (o.kind === 'snake') { for (let i = 0; i < 7; i++) { const dx = (hash2(i, 3) - .5) * .3 * s, dy = (hash2(i, 9) - .5) * .3 * s, h = (.4 + hash2(i, 5) * .45) * s; tube([x + dx * .4, y + dy * .4, zz], [x + dx, y + dy, zz + h], i % 2 ? lf : dk(lf, .15)); spx(x + dx, y + dy, zz + h, 0, 0, '#d8d86a'); } return; }
  ball(x, y, zz + .28 * s, .3 * s, lf); ball(x - .14 * s, y + .12 * s, zz + .12 * s, .18 * s, dk(lf, .1), { ol: false }); ball(x + .13 * s, y + .05 * s, zz + .42 * s, .17 * s, lt(lf, .12), { ol: false });
  if (o.flower) for (let i = 0; i < 5; i++) spx(x, y, zz + .3 * s, Math.round((hash2(i, 1) - .5) * 9 * s), Math.round((hash2(i, 2) - .5) * 8 * s), o.flower);
}
/** cardboard box with tape + label */
export function carton(x, y, z, w, d, h, c, o) {
  c = c || K.card; o = o || {};
  box(x, y, z, w, d, h, c);
  lw([x + w / 2, y, z + h], [x + w / 2, y + d, z + h], lt(c, .35)); lw([x + w / 2, y + d, z + h], [x + w / 2, y + d, z + h - .1], lt(c, .25));
  if (o.label !== false && w >= .3 && h >= .25) qy(x + w * .58, x + w * .58 + .14, y + d, z + h * .35, z + h * .35 + .1, o.label || '#f4f0e8');
}
/** wooden pallet */
export function pallet(x, y, z, w, d) {
  const c = '#b89060'; for (const yy of [y, y + d / 2 - .06, y + d - .12]) bx(x, yy, z, w, .12, .08, dk(c, .2));
  box(x, y, z + .08, w, d, .05, c, { t: (wx, wy) => (Math.floor(wx * 16) % 5 === 0) ? dk(c, .4) : c });
}

/* ---------- product shelves: pattern for qy/qx faces ---------- */
const PALS = {
  bright: ['#d63a3a', '#f2c230', '#3c64ad', '#3f8a55', '#e8843a', '#f1ede4', '#7a55b0', '#2f8f8a', '#e87aa0'],
  pastel: ['#f1ede4', '#9fd0e8', '#f4b8c8', '#b8e0a8', '#f6e08a', '#c8b8e8', '#f0c8a0'],
  book: ['#a83a3a', '#2f5f8f', '#3f7a55', '#d8b040', '#6a4a8a', '#c86a3a', '#e8dcc0', '#2f6f6f', '#7a3a4a', '#4a5a6a'],
  drink: ['#d63a3a', '#3f8a55', '#f28a30', '#6fb6d8', '#f2c230', '#7a55b0', '#f1ede4', '#5a3a2a'],
  liquor: ['#c8842a', '#5a8a4a', '#e8d8a0', '#8a3a2a', '#6fb6d8', '#d8d8e0', '#3a5a3a', '#e8a040'],
  bread: ['#d8a050', '#c88838', '#e0b468', '#b87830'],
  cloth: ['#d63a3a', '#3c64ad', '#f1ede4', '#3a3f4c', '#f2c230', '#3f8a55', '#e87aa0', '#c0a078', '#6fb6d8'],
  parcel: ['#c99a62', '#b8854e', '#d8b07a', '#c99a62', '#e8e0d0', '#a87848'],
  med: ['#f1ede4', '#f1ede4', '#9fd0e8', '#f4b8c8', '#f1ede4', '#b8e0a8'],
  file: ['#d8d2c0', '#c8b890', '#3c64ad', '#d63a3a', '#3a3f4c', '#3f8a55', '#e8e0d0'],
  tech: ['#3a3f4c', '#f1ede4', '#5a6272', '#2a2733', '#8a9098'],
  shoe: ['#d63a3a', '#f1ede4', '#3a3f4c', '#8a5a3a', '#3c64ad', '#f2c230', '#e87aa0'],
  mag: ['#e87aa0', '#6fb6d8', '#f2c230', '#f1ede4', '#d63a3a', '#3f8a55', '#7a55b0', '#e8843a'],
};
// w:[min,max] item px width, h:[min,max] px height, gap px, run: facings of the same product, label/cap decoration
const KINDS = {
  cans: { w: [2, 2], h: [3, 3], gap: 1, run: 3, pal: 'bright', label: 1 },
  cereal: { w: [3, 4], h: [5, 6], gap: 1, run: 2, pal: 'bright', label: 2 },
  snacks: { w: [3, 3], h: [4, 4], gap: 1, run: 3, pal: 'bright', label: 3 },
  drinks: { w: [2, 2], h: [5, 5], gap: 1, run: 3, pal: 'drink', cap: 1 },
  household: { w: [2, 4], h: [4, 6], gap: 1, run: 2, pal: 'pastel', cap: 2 },
  books: { w: [1, 2], h: [5, 7], gap: 0, run: 1, pal: 'book', miss: .07, band: 1 },
  liquor: { w: [2, 2], h: [4, 6], gap: 1, run: 1, pal: 'liquor', cap: 1 },
  bread: { w: [4, 5], h: [3, 3], gap: 1, run: 2, pal: 'bread', loaf: 1 },
  folded: { w: [5, 6], h: [2, 5], gap: 1, run: 1, pal: 'cloth', fold: 1 },
  parcels: { w: [3, 7], h: [3, 7], gap: 1, run: 1, pal: 'parcel', tape: 1, miss: .08 },
  med: { w: [2, 3], h: [3, 4], gap: 1, run: 2, pal: 'med', label: 1 },
  files: { w: [2, 2], h: [6, 7], gap: 0, run: 1, pal: 'file', band: 1, miss: .1 },
  tech: { w: [4, 6], h: [4, 6], gap: 2, run: 1, pal: 'tech', label: 2 },
  shoes: { w: [4, 4], h: [2, 2], gap: 2, run: 1, pal: 'shoe', shoe: 1 },
  mags: { w: [4, 4], h: [6, 6], gap: 1, run: 1, pal: 'mag', label: 2 },
  cigs: { w: [2, 2], h: [3, 3], gap: 0, run: 2, pal: 'bright', label: 1 },
  frozen: { w: [4, 5], h: [3, 4], gap: 1, run: 2, pal: 'pastel', label: 2 },
  dairy: { w: [2, 3], h: [4, 5], gap: 1, run: 3, pal: 'pastel', cap: 1 },
};
/**
 * goods(kind, rows, {seed, back, board, pal}) -> pattern fn(u,v,w,h) painting `rows` shelves of products.
 * Use as the colour arg of qy/qx or box o.l/o.r.
 */
export function goods(kind, rows, o) {
  o = o || {}; const k = KINDS[kind] || KINDS.cans, seed = o.seed || 1, back = o.back || '#3a3344', board = o.board || '#cfc8b4', pl = o.pal || PALS[k.pal], cache = [];
  const layout = r => {
    if (cache[r]) return cache[r]; const a = []; let u = 1, i = 0;
    while (u < 420) {
      const t = Math.floor(i / k.run), rw = hash2(t, r, seed), w = k.w[0] + Math.floor(rw * (k.w[1] - k.w[0] + .999)), h = k.h[0] + Math.floor(hash2(t, r, seed + 11) * (k.h[1] - k.h[0] + .999));
      const c = pl[Math.floor(hash2(t, r, seed + 23) * pl.length)], miss = k.miss && hash2(i, r, seed + 5) < k.miss;
      if (!miss) for (let s = 0; s < w; s++) a[u + s] = { c, h, s, w, t };
      u += w + k.gap; i++;
    }
    return cache[r] = a;
  };
  return (u, v, w, h) => {
    const rowH = h / rows, r = Math.min(rows - 1, Math.floor(v / rowH)), vv = v - Math.round(r * rowH);
    if (vv <= 0) return board; if (u < 1 || u >= w - 1) return back;
    const q = layout(r)[u]; if (!q) return back; const ih = Math.min(q.h, Math.floor(rowH) - 2), y = vv - 1; if (y >= ih) return back;
    const c = q.c;
    if (k.cap && y === ih - 1) return k.cap === 2 ? (q.s === 0 ? dk(c, .3) : back) : (q.w > 2 && q.s !== 1 ? back : lt(c, .55));
    if (k.cap === 1 && y === ih - 2 && q.w <= 2) return q.s === 0 ? lt(c, .2) : c;
    if (k.label === 1 && y === 1) return lt(c, .6);
    if (k.label === 2 && y >= ih - 3 && y < ih - 1 && q.s > 0 && q.s < q.w - 1) return lt(c, .65);
    if (k.label === 3 && y === 2 && q.s === 1) return lt(c, .7);
    if (k.band && y === ih - 2) return lt(c, .45);
    if (k.loaf) return (y === ih - 1 && (q.s === 0 || q.s === q.w - 1)) ? back : y === ih - 1 ? lt(c, .25) : (q.s % 2 ? c : dk(c, .12));
    if (k.fold) return y % 2 ? dk(c, .16) : c;
    if (k.tape) return q.s === (q.w >> 1) ? lt(c, .3) : y === ih - 1 ? lt(c, .15) : c;
    if (k.shoe) return y === 0 ? (q.s === 0 ? back : '#f1ede4') : (q.s < 2 ? back : c);
    return q.s === q.w - 1 && q.w > 2 ? dk(c, .16) : c;
  };
}
/** open shelving unit: carcass box with goods on the +y face, plain end panel on +x */
export function shelf(x, y, z, w, d, h, c, kind, rows, o) {
  o = o || {};
  box(x, y, z, w, d, h, c, { l: goods(kind, rows, o) });
  qy(x, x + P, y + d, z, z + h, dk(c, .1)); qy(x + w - P, x + w, y + d, z, z + h, dk(c, .1)); lw([x, y + d, z + h - P / 2], [x + w, y + d, z + h - P / 2], lt(c, .2));
  if (o.kick !== false) qy(x, x + w, y + d, z, z + .08, dk(c, .45));
}
/** heap texture for the top of produce bins etc: fn(wx,wy) */
export const heap = (c, n = 8, s = 0) => { const a = dk(c, .16), b = lt(c, .28); return (x, y) => { const i = Math.floor(x * n + 50), j = Math.floor(y * n + 50), k = hash2(i, j, s); return k < .28 ? a : k > .78 ? b : c; }; };
export const heap2 = (cols, n = 8, s = 0) => (x, y) => cols[Math.floor(hash2(Math.floor(x * n + 50), Math.floor(y * n + 50), s) * cols.length)];

/* ---------- gallery helpers (test rooms) ---------- */
/** scale-reference person, 1.4 tall, standing at x,y (z floor). o.sit lowers them */
export function dude(x, y, z, shirt, o) {
  o = o || {}; const s = PW(x, y, z || 0), X = Math.round(s[0]), Y = Math.round(s[1]), skin = o.skin || '#f0c8a0', hair = o.hair || '#4a3028', pant = o.pant || '#3a4a6a', sit = o.sit ? 5 : 0;
  shirt = shirt || '#d86a4a'; const T = Y - 22 + sit;
  rect(X - 3, T - 1, 6, 1, '#2a1f45'); rect(X - 3, T, 6, 2, hair); rect(X - 3, T + 2, 6, 4, skin); rect(X - 3, T + 2, 1, 2, hair); if (!o.manq) { px(X - 1, T + 3, C('#2a1f45')); px(X + 1, T + 3, C('#2a1f45')); }
  rect(X - 4, T + 6, 8, 8, shirt); rect(X - 4, T + 6, 1, 7, dk(shirt, .2)); rect(X + 3, T + 6, 1, 7, dk(shirt, .2)); rect(X - 4, T + 12, 1, 2, skin); rect(X + 3, T + 12, 1, 2, skin);
  if (o.apron) rect(X - 2, T + 8, 4, 6, o.apron);
  rect(X - 3, T + 14, 6, 8 - sit, pant); if (!sit) rect(X, T + 16, 1, 6, dk(pant, .5)); rect(X - 3, Y - 1, 3, 1, '#2a2733'); rect(X + 1, Y - 1, 3, 1, '#2a2733');
}
/** cutaway room shell for composed previews: floor + two back walls */
export function room(w, d, h, o) {
  o = o || {}; const wall = o.wall || '#e8dcc0', fl = o.floor || PAT.ftile('#d8cdb5', '#cdc2aa', 1), base = o.base || dk(wall, .3);
  qz(0, w, 0, d, 0, fl);
  qy(0, w, 0, 0, h, o.wallpat ? o.wallpat(wall) : wall); qx(0, 0, d, 0, h, o.wallpat ? o.wallpat(dk(wall, .12)) : dk(wall, .12));
  if (o.dado) { qy(0, w, 0, 0, o.dado, o.dadoc); qx(0, 0, d, 0, o.dado, dk(o.dadoc, .12)); }
  qy(0, w, 0, 0, .12, base); qx(0, 0, d, 0, .12, dk(base, .1));
  lw([0, 0, 0], [0, 0, h], dk(wall, .35)); lw([0, 0, h], [w, 0, h], dk(wall, .5)); lw([0, 0, h], [0, d, h], dk(wall, .5));
}
/**
 * composed preview room. lists = asset arrays; items = [[id(without furn.) | 'dude' | fn, x, y, params|shirt, z], ...]
 * wall assets are drawn first, the rest sorted back-to-front by footprint centre.
 */
export function compose(lists, id, w, d, h, o, items) {
  const m = new Map(); for (const l of lists) for (const a of l) m.set(a.id, a);
  return {
    id, vb: [-.2, -.2, 0, w + .2, d + .2, h + .3], draw: () => {
      room(w, d, h, o);
      const L = items.map((it, i) => {
        if (it[0] === 'dude') return { k: it[1] + it[2] + .2, f: () => dude(it[1], it[2], it[4] || 0, it[3], it[5]) };
        if (typeof it[0] === 'function') return { k: it[1] + it[2], f: () => at(it[1], it[2], it[4] || 0, it[0]) };
        const a = m.get('furn.' + it[0]); if (!a) throw new Error('no asset furn.' + it[0]);
        const p = Object.assign({ seed: 1 }, (a.variants && a.variants[0]) || {}, it[3] || {}), s = typeof a.size === 'function' ? a.size(p) : a.size;
        return { k: a.wall || a.flat ? -100 + i * .01 : it[1] + it[2] + (s[0] + s[1]) / 2, f: () => at(it[1], it[2], it[4] || 0, () => a.draw(p)) };
      });
      L.sort((a, b) => a.k - b.k).forEach(e => e.f());
    },
  };
}

/* ---------- small set-dressing ---------- */
export const screenY = (x0, x1, y, z0, z1, c, seed, ink) => lit(() => { qy(x0, x1, y, z0, z1, c); if (seed !== 0) screenLines(x0 + P, x1 - P, y, z0 + P, z1, ink || lt(c, .6), seed || 1); });
export function mirrorY(x0, x1, y, z0, z1, fr) {
  qy(x0, x1, y, z0, z1, '#b4dbe8', '#c4e6f0'); const w = x1 - x0, h = z1 - z0;
  for (const k of [.18, .3, .7]) lw([x0 + w * k, y, z0 + h * .9], [x0 + w * k + Math.min(.3, w * .3), y, z0 + h * .9 - Math.min(.6, h * .5)], '#eefafc');
  frameY(x0, x1, y, z0, z1, fr || '#8a9098');
}
/** pleated curtain pattern */
export const pleat = c => { const a = [lt(c, .12), c, dk(c, .14), c]; return (u, v) => a[u % 4]; };
export const steam = (x, y, z, n = 4) => { for (let i = 0; i < n; i++) { spx(x, y, z + i * .11, i % 2 ? 1 : -1, 0, '#f4fbfc'); if (i % 2) spx(x, y, z + i * .11, 2, -1, '#e4eef2'); } };
export const plate = (x, y, z, c, f) => { cyl(x, y, z, .11, .02, c || '#f4f0e8', { ol: false }); if (f) cyl(x, y, z + .02, .06, .03, f, { ol: false }); };
export const cup = (x, y, z, c) => cyl(x, y, z, .05, .1, c || '#f4f0e8', { ol: false, t: '#6a4a30' });
export const bottle = (x, y, z, c, h) => { cyl(x, y, z, .045, h || .16, c, { ol: false }); post(x, y, z + (h || .16), z + (h || .16) + .1, c); };
export function candle(x, y, z) { post(x, y, z, z + .12, '#f4f0e8'); lit(() => { spx(x, y, z + .13, 0, -1, '#ffb040'); spx(x, y, z + .13, 0, -2, '#ffe680'); }); glow(() => { for (const [a, b] of [[-1, -1], [1, -1], [0, -3], [-1, -2], [1, -2], [0, 0], [-2, -1], [2, -1]]) spx(x, y, z + .13, a, b, '#ffd070'); }); }
/** table/desk lamp with shade (glows at night) */
export function lamp(x, y, z, h, c, o) {
  o = o || {}; cyl(x, y, z, .07, .03, o.base || '#8a6a3a', { ol: false }); post(x, y, z, z + h - .14, o.base || '#8a6a3a');
  cyl(x, y, z + h - .16, o.r || .13, .16, c, { ol: false, t: lt(c, .4) }); glow(() => { cyl(x, y, z + h - .16, o.r || .13, .16, '#ffe6a0', { ol: false }); cyl(x, y, z + h - .22, (o.r || .13) + .04, .02, '#ffd070', { ol: false }); });
}
/** flat rug with border on the floor */
export function rug(x, y, w, d, c, c2, o) {
  o = o || {}; qz(x, x + w, y, y + d, .01, c2 || lt(c, .3)); qz(x + .1, x + w - .1, y + .1, y + d - .1, .01, o.pat || c); if (o.inner) qz(x + .22, x + w - .22, y + .22, y + d - .22, .01, o.inner, o.inner2);
  frameZ(x, x + w, y, y + d, .01, dk(c, .35));
}
