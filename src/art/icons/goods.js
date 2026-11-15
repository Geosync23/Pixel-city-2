// Icons for the home-goods catalogue (Wave C), registered straight into ICONS (see icons.js):
//   - one 16x16 icon per good ('g_<id>'): made from the good's own furniture art (cropped, shrunk to fit, the most common colour of each cell wins),
//     so every icon is the actual piece in its actual colours. Built on first use.
//   - an emblem per store ('store.goods:<key>') and a glyph per catalogue category ('gcat.<cat>').
import { ICONS } from './icons.js';
import { icon, R, r, st, spr, p, ps, ln, OV, ov, PG, OL } from './_lib.js';
import { render, screenBox } from '../../engine/raster.js';
import { ASSETS, assetSize } from '../registry.js';
import { GOODS, STORES, CATS } from '../../data/goods.js';

const hex = v => '#' + [v & 255, v >> 8 & 255, v >> 16 & 255].map(n => n.toString(16).padStart(2, '0')).join('');
function shrink(g) {
  const a = ASSETS.get('furn.home.' + g.art); if (!a) return [];
  const pp = Object.assign({}, g.p, { on: true }), size = assetSize(a, pp), vb = a.vb ? (typeof a.vb === 'function' ? a.vb(pp) : a.vb) : [-.3, -.3, 0, size[0] + .3, size[1] + .3, size[2] + .3];
  const s = render(screenBox(vb), () => a.draw(pp)); let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) { const v = s.buf[y * s.w + x]; if ((v >>> 24) > 200) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
  if (x1 < 0) return []; const w = x1 - x0 + 1, h = y1 - y0 + 1, f = Math.max(1, Math.max(w, h) / 15), tw = Math.max(1, Math.round(w / f)), th = Math.max(1, Math.round(h / f)), ox = (16 - tw) >> 1, oy = (16 - th) >> 1, out = [];
  for (let ty = 0; ty < th; ty++) for (let tx = 0; tx < tw; tx++) {
    const cnt = new Map(); let n = 0, tot = 0;
    for (let y = y0 + Math.floor(ty * f); y < y0 + Math.max(Math.floor(ty * f) + 1, Math.floor((ty + 1) * f)) && y <= y1; y++) for (let x = x0 + Math.floor(tx * f); x < x0 + Math.max(Math.floor(tx * f) + 1, Math.floor((tx + 1) * f)) && x <= x1; x++) { tot++; const v = s.buf[y * s.w + x]; if ((v >>> 24) > 200) { n++; cnt.set(v, (cnt.get(v) || 0) + 1); } }
    if (!n || n < tot * .34) continue; let best = 0, bv = 0; for (const [v, c] of cnt) if (c > best) { best = c; bv = v; }
    out.push([ox + tx, oy + ty, hex(bv)]);
  }
  return out;
}
for (const g of GOODS) { if (ICONS[g.id]) continue; let px = null; ICONS[g.id] = icon(() => { if (!px) px = shrink(g); for (const q of px) st([[q[0], q[1]]], q[2]); }); }

/* ---------- store emblems: a coloured shop tile with the store's mark ---------- */
const tile = (bg, body) => () => { R(1, 1, 14, 14, bg); body(); };
const M = (rows, c, x = 3, y = 3) => spr(x, y, rows, { '#': c, o: OL, w: '#fff8e0', g: '#58b868', y: '#f2c230', r: '#d9483b', b: '#4f8fd8', n: '#8a5a3a' });
const EMBLEM = {
  'goods:timber': tile('#e0662e', () => M(['....##....', '...####...', '..######..', '.########.', '....nn....', '....nn....', '.wwwwwwww.', '.w.w..w.w.', '.wwwwwwww.'], '#2f5a48')),
  'goods:fjord': tile('#3f6fb0', () => M(['yyyyyyyyyy', 'y........y', 'y.yyyyyy.y', 'y.y....y.y', 'y.y.yy.y.y', 'y.y....y.y', 'y.yyyyyy.y', 'y........y', 'yyyyyyyyyy'], '#f2c230')),
  'goods:bellwether': tile('#39456f', () => M(['....yy....', '...yyyy...', '..yyyyyy..', '..yyyyyy..', '..yyyyyy..', '.yyyyyyyy.', '.yyyyyyyy.', '....yy....', '...yyyy...'], '#f2d27a')),
  'goods:lumen': tile('#2c2738', () => M(['...yyyy...', '..yyyyyy..', '.yyywwyyy.', '.yyywwyyy.', '..yyyyyy..', '...yyyy...', '...wwww...', '...wwww...', '....ww....'], '#ffe6a0')),
  'goods:voltaic': tile('#1f2a44', () => M(['.....bbb..', '....bbb...', '...bbb....', '..bbbbbb..', '....bbb...', '...bbb....', '..bbb.....', '..bb......', '..b.......'], '#58d8f8')),
  'goods:loam': tile('#e8f4d8', () => M(['....g.....', '...ggg..g.', '..ggggggg.', '..gggggg..', '...gggg...', '....gg....', '...nnnn...', '...nnnn...', '....nn....'], '#2f6a48')),
  'goods:attic': tile('#5a3f3a', () => M(['..yyyyyy..', '.y......y.', '.y.wwww.y.', '.y.w..w.y.', '.y.w..w.y.', '.y.wwww.y.', '.y......y.', '..yyyyyy..', '...y..y...'], '#e8c878')),
  'goods:warp': tile('#7a3a4a', () => M(['wwwwwwwwww', 'wrrwwwwrrw', 'wrwyyyywrw', 'wwywrrwyww', 'wwywrrwyww', 'wrwyyyywrw', 'wrrwwwwrrw', 'wwwwwwwwww', '.w.w.w.w.w'], '#f4e4c8')),
  'goods:copper': tile('#fff3dc', () => M(['..........', '.nnnnnnn..', '.nnnnnnnoo', '.nnnnnnn..', '.nnnnnnn..', '..nnnnn...', '..........', '..........', '..........'], '#b9653a', 3, 5)),
  'goods:nord': tile('#f1eee6', () => M(['o........o', 'oo.......o', 'o.o......o', 'o..o.....o', 'o...o....o', 'o....o...o', 'o.....o..o', 'o......o.o', 'o.......oo'], OL)),
  'goods:kestrel': tile('#9c6a3e', () => M(['..........', '.yyyyyyyy.', '.yyyyyyyy.', '.wwwwwwww.', '.w......w.', '.w......w.', 'w........w', '..........', '..........'], '#f2e2b8', 3, 4)),
  'goods:sleepy': tile('#6a7ab8', () => M(['......ww..', '.....www..', '.....ww...', '..........', 'ww........', 'wwwwwwwwww', 'wwwwwwwwww', 'w........w', 'w........w'], '#f4f0ff')),
  'goods:spoke': tile('#c8574d', () => M(['...wwww...', '..w.ww.w..', '.w..ww..w.', '.wwwwwwww.', '.wwwwwwww.', '.w..ww..w.', '..w.ww.w..', '...wwww...', '..........'], '#fff8e0')),
};
for (const s of STORES) if (EMBLEM[s.id] && !ICONS['store.' + s.id]) ICONS['store.' + s.id] = icon(EMBLEM[s.id]);

/* ---------- category glyphs ---------- */
const CAT = {
  seating: () => { R(2, 6, 12, 6, '#3f8f8a'); r(2, 4, 12, 3, '#3f8f8a'); r(1, 7, 2, 5, '#2f6f6a'); r(13, 7, 2, 5, '#2f6f6a'); ps([[3, 13], [12, 13]], '#6b4630'); },
  tables: () => { R(1, 5, 14, 3, '#b08a5a'); r(2, 8, 2, 6, '#8a6a48'); r(12, 8, 2, 6, '#8a6a48'); },
  beds: () => { R(1, 8, 14, 5, '#4f74b8'); r(1, 4, 2, 9, '#8a6a48'); r(3, 6, 4, 2, '#f8f5ee'); ps([[1, 13], [14, 13]], OL); },
  storage: () => { R(3, 2, 10, 13, '#b08a5a'); r(4, 6, 8, 1, '#6b4630'); r(4, 10, 8, 1, '#6b4630'); ps([[7, 4], [8, 4], [7, 8], [8, 8], [7, 12], [8, 12]], '#d9b65c'); },
  lighting: () => { PG([[5, 2], [11, 2], [13, 8], [3, 8]], '#ffe6a0'); r(7, 9, 2, 4, '#d9b65c'); R(5, 13, 6, 2, '#d9b65c'); },
  plants: () => { R(5, 10, 6, 5, '#c9764a'); OV(3, 2, 6, 7, '#3f9a55'); OV(8, 3, 6, 7, '#58b868'); r(7, 7, 2, 4, '#2f7a48'); },
  rugs: () => { R(1, 4, 14, 9, '#b8432a'); r(3, 6, 10, 5, '#e8c88a'); r(5, 8, 6, 1, '#2f5f6a'); ps([[1, 3], [3, 3], [5, 3], [7, 3], [9, 3], [11, 3], [13, 3]], '#e8c88a'); },
  wall: () => { R(2, 2, 12, 11, '#d9b65c'); r(4, 4, 8, 7, '#8fc8ea'); r(4, 9, 8, 2, '#6dbb68'); ov(9, 5, 2, 2, '#fff2c4'); },
  decor: () => { OV(4, 6, 8, 8, '#3f6f8a'); r(6, 3, 4, 4, '#3f6f8a'); r(6, 2, 4, 1, OL); p(6, 8, '#9ad0e8'); },
  electronics: () => { R(1, 3, 14, 9, '#2c2c36'); r(2, 4, 12, 7, '#5ad8ff'); r(2, 8, 12, 3, '#3f9a55'); r(6, 12, 4, 2, '#59607a'); r(4, 14, 8, 1, '#59607a'); },
  kitchen: () => { OV(3, 5, 9, 9, '#c8574d'); r(6, 3, 3, 2, '#c8574d'); p(7, 2, OL); ln(12, 8, 14, 6, '#c8574d'); ln(3, 7, 1, 9, OL); },
  hobby: () => { OV(1, 8, 6, 6, '#59607a'); OV(9, 8, 6, 6, '#59607a'); ln(4, 11, 8, 6, '#e03a4a'); ln(8, 6, 12, 11, '#e03a4a'); ln(4, 11, 9, 11, '#e03a4a'); r(7, 4, 3, 1, OL); },
  fitness: () => { r(2, 5, 2, 6, '#59607a'); r(12, 5, 2, 6, '#59607a'); r(4, 7, 8, 2, '#b9c2c9'); r(1, 6, 1, 4, '#3a3a46'); r(14, 6, 1, 4, '#3a3a46'); },
  music: () => { r(6, 2, 2, 10, OL); r(8, 2, 5, 2, OL); r(12, 2, 1, 8, OL); OV(3, 10, 5, 4, '#7a5590'); OV(9, 8, 5, 4, '#7a5590'); },
  bath: () => { R(1, 7, 14, 5, '#f8f5ee'); r(2, 12, 2, 2, '#d9b65c'); r(12, 12, 2, 2, '#d9b65c'); r(12, 2, 1, 5, '#b9c2c9'); r(10, 2, 3, 1, '#b9c2c9'); ps([[4, 5], [6, 4], [8, 5]], '#9ad0e8'); },
  outdoor: () => { PG([[1, 7], [8, 2], [15, 7]], '#c8574d'); r(7, 7, 2, 7, '#6b4630'); r(4, 14, 8, 1, '#59607a'); ps([[4, 6], [8, 4], [12, 6]], '#f8f5ee'); },
};
for (const k in CATS) if (CAT[k] && !ICONS['gcat.' + k]) ICONS['gcat.' + k] = icon(CAT[k]);
