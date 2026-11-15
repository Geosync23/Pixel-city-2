// Shared palette + helpers for the Gull Point Lighthouse art (lighthouse.js, lighthouse_top.js). Not an asset module.
//   panoPat({ time: day | dawn | dusk | night, wx, season, side: 'bay' | 'sea', hz (horizon px above the bottom), seed }) -> wall pattern fn(u, v, w, h): sky, sun / moon, stars, clouds, sea, far shore + skyline
//   FLAG_COL(letter, u, v) -> hex (International Code of Signals)   flagAt(letter, X, Y, w, h) target-pixel flag   shipPx(kind, c, X, Y, night) tiny ship silhouette
//   stone(c) whitewashed block wall pattern   S2, dot   rope(a, b, c)
import * as R from '../../engine/raster.js';
const { hash2, PW, px, C, mix, dk, lt, lw } = R;
export { R };
export const WHITE = '#efe9da', WHITE_D = '#d2cab8', NAVY = '#2e3a52', NAVY_L = '#465878', REDL = '#b8402e', BRASS = '#d8a848', BRASS_D = '#a87a2c', BRASS_L = '#f6d67a', WOOD = '#8a5c3a', WOOD_D = '#5e3c26', WOOD_L = '#b07e52', IRON = '#3a4250', IRON_D = '#272c38', GREEN = '#2f5a4a',
  INK = '#2a2733', CREAM = '#f4ecd8', GLASS = '#bfe4ee', STONE = '#b8b2a6', WARM = '#ffe2a0', SEA = '#2f7fa8';
export const S2 = (x, y, z) => { const s = PW(x, y, z); return [Math.round(s[0]), Math.round(s[1])]; };
export const dot = (x, y, z, c, r = 1) => { const s = S2(x, y, z), cc = C(c); for (let j = -r + 1; j < r; j++) for (let i = -r + 1; i < r; i++) px(s[0] + i, s[1] + j, cc); };
export const stone = (c = WHITE) => { const m = dk(c, .16), c2 = dk(c, .05); return (u, v) => { const row = Math.floor(v / 7); if (v % 7 === 0) return m; const uu = u + (row & 1) * 7; if (uu % 14 === 0) return m; return hash2(Math.floor(uu / 14), row, 3) > .7 ? c2 : c; }; };
const MX = new Map(), mx = (a, b, k) => { const key = a + b + k; let v = MX.get(key); if (!v) { v = mix(a, b, k); MX.set(key, v); } return v; };
export function panoPat(o = {}) {
  const t = o.time || 'day', wx = String(o.wx || 'clear'), fog = /fog/.test(wx), storm = /storm/.test(wx), ov = /rain|storm|snow|cloud/.test(wx), night = t === 'night', side = o.side || 'sea', seed = o.seed || 1, winter = o.season === 3;
  const SK = night ? ['#1c2850', '#141c3c', '#0e142c'] : ov ? ['#b4bec6', '#9eaab4', '#8896a2'] : t === 'dusk' ? ['#f6a05a', '#e87e6a', '#6a5a98'] : t === 'dawn' ? ['#f8d090', '#f4aa98', '#8aa8d8'] : ['#cdeefa', '#a2dcf4', '#78c2ea'];
  const SE = night ? ['#0c1830', '#16264a'] : ov ? ['#4e6672', '#627c88'] : t === 'dusk' ? ['#4e4a80', '#b8705e'] : t === 'dawn' ? ['#5a7aa8', '#dca08c'] : ['#2a78a4', '#4a9ac0'];
  const cloudC = night ? '#2a3458' : ov ? (storm ? '#5a6672' : '#c8d0d6') : t === 'dusk' ? '#f8c0a0' : t === 'dawn' ? '#fbe2c8' : '#ffffff', fogC = night ? '#3a4458' : '#c6ced2';
  const land = night ? '#141c30' : winter ? '#dfe8ee' : t === 'dusk' ? '#5a4a6a' : t === 'dawn' ? '#7a84a0' : ov ? '#6a7a80' : '#6a9a7a', bldC = night ? '#1c2440' : t === 'dusk' ? '#6a5878' : t === 'dawn' ? '#8a90aa' : ov ? '#7a8890' : '#9aaab8';
  return (u, v, W, H) => {
    const hz = o.hz === undefined ? Math.round(H * .4) : o.hz, sunU = Math.round(W * (side === 'sea' ? .62 : .3)); let c;
    if (v < hz) { // the sea
      const d = v / Math.max(1, hz), k = hash2(u >> 1, v, seed); c = k > .5 + d * .25 ? SE[0] : SE[1];
      if (hash2(u >> 2, v, seed + 4) > (storm ? .8 : .92) && ((v + (u >> 2)) & 1)) c = night ? '#3a4a78' : '#e8f4f8';
      if (!ov && !fog && t !== 'day' && Math.abs(u - sunU) < 1 + (hz - v) * .4 && hash2(u >> 1, v, 9) > .72 && (v & 1)) c = night ? '#c8d4f0' : t === 'dusk' ? '#ffd890' : '#fff0c0';
      if (side === 'sea') { for (const [iu, iw, ih] of [[.18, 14, 5], [.82, 9, 4]]) { const dx = Math.abs(u - W * iu), top = hz - 3 + Math.round(ih * (1 - (dx / iw) ** 2)); if (dx < iw && v >= hz - 4 && v < top) c = land; } }
      if (fog) c = mx(c, fogC, v > hz * .5 ? .8 : .45);
      return c;
    }
    const a = (v - hz) / Math.max(1, H - hz), k = hash2(u >> 1, v >> 1, seed + 2); c = a < .22 ? (k > a * 4 ? SK[0] : SK[1]) : a < .6 ? (k > (a - .22) * 2.6 ? SK[1] : SK[2]) : SK[2];
    if (night && !ov && !fog && hash2(u, v, 11) > .993) c = hash2(u, v, 12) > .5 ? '#ffffff' : '#c8d4f8';
    if (!ov && !fog) { const sv = t === 'day' ? hz + Math.round((H - hz) * .78) : night ? hz + Math.round((H - hz) * .62) : hz + 5, r = night ? 4 : 5, dd = (u - sunU) ** 2 + (v - sv) ** 2; if (dd < r * r) c = night ? (dd < 6 && (u + v) % 3 === 0 ? '#d8dcec' : '#f4f4fa') : t === 'dusk' ? '#ffb040' : t === 'dawn' ? '#ffe090' : '#fff8d0'; else if (!night && dd < (r + 3) ** 2 && ((u + v) & 1)) c = t === 'day' ? '#f0fbff' : '#ffd8a0'; }
    { const cu = u + (o.drift || 0), b = hash2(cu >> 4, v >> 2, seed + 5), b2 = hash2((cu + 8) >> 4, (v + 1) >> 2, seed + 5); if (v > hz + (H - hz) * .3 && (b > (ov ? .3 : .78) || (ov && b2 > .5)) && (ov || ((cu >> 1) + (v >> 1)) % 5 !== 0)) c = b > .9 ? lt(cloudC, .1) : cloudC; }
    if (side === 'bay') { // the far shore: hills, the city, the Bay Wheel
      const hill = 3 + Math.round(3 * Math.sin(u * .045 + seed) + 2 * Math.sin(u * .11 + seed * 2)), city = u > W * .28 && u < W * .86, bh = city ? 2 + Math.floor(hash2(u >> 2, 1, seed + 6) * (u > W * .45 && u < W * .66 ? 13 : 6)) : 0, dv = v - hz;
      if (dv < hill + 2) c = land; if (city && dv < bh) { c = bldC; if (night && hash2(u, dv, 8) > .55 && (u & 1)) c = '#ffd070'; else if (!night && (u >> 2) % 2 === 0 && dv % 2 === 0) c = dk(bldC, .12); }
      const wu = u - W * .17, wv = dv - 8, wr = wu * wu + wv * wv; if (wr < 49 && wr > 30) c = night ? ['#ff6a8a', '#ffd070', '#6ad0ff'][(u + v) % 3] : dk(bldC, .3); if (Math.abs(wu) < 1 && dv < 8 && dv >= 0) c = dk(bldC, .3);
    }
    if (fog) c = mx(c, fogC, .82); else if (storm) c = mx(c, '#4a5460', .25);
    return c;
  };
}
const Wt = '#f8f6ee', Rd = '#d8342e', Bl = '#2c4fb0', Yl = '#f2c830', Bk = '#2a2733';
export function FLAG_COL(L, u, v) {
  const cx = Math.abs(u - .5), cy = Math.abs(v - .5), sal = Math.abs(cx - cy) < .16, crs = cx < .14 || cy < .16;
  switch (L) {
    case 'A': return u < .5 ? Wt : Bl; case 'B': return Rd; case 'C': return v < .2 || v >= .8 ? Bl : v < .4 || v >= .6 ? Wt : Rd; case 'D': return v < .25 || v >= .75 ? Yl : Bl; case 'E': return v < .5 ? Bl : Rd;
    case 'F': return cx + cy < .42 ? Rd : Wt; case 'G': return Math.floor(u * 6) % 2 ? Bl : Yl; case 'H': return u < .5 ? Wt : Rd; case 'I': return cx * cx + cy * cy < .07 ? Bk : Yl; case 'J': return v < .33 || v >= .67 ? Bl : Wt;
    case 'K': return u < .5 ? Yl : Bl; case 'L': return (u < .5) === (v < .5) ? Yl : Bk; case 'M': return sal ? Wt : Bl; case 'N': return (Math.floor(u * 4) + Math.floor(v * 4)) % 2 ? Wt : Bl; case 'O': return u + (1 - v) > 1 ? Rd : Yl;
    case 'P': return cx < .25 && cy < .25 ? Wt : Bl; case 'Q': return Yl; case 'R': return crs ? Yl : Rd; case 'S': return cx < .25 && cy < .25 ? Bl : Wt; case 'T': return u < .34 ? Rd : u < .67 ? Wt : Bl;
    case 'U': return (u < .5) === (v < .5) ? Rd : Wt; case 'V': return sal ? Rd : Wt; case 'W': return cx < .17 && cy < .17 ? Rd : cx < .34 && cy < .34 ? Wt : Bl; case 'X': return crs ? Bl : Wt; case 'Y': return Math.floor((u + v) * 5) % 2 ? Rd : Yl;
    case 'Z': return cy > cx ? (v < .5 ? Yl : Rd) : (u < .5 ? Bk : Bl); default: return Wt;
  }
}
export function flagAt(L, X, Y, w = 9, h = 7) { const o = C('#4a4458'); for (let i = -1; i <= w; i++) { px(X + i, Y - 1, o); px(X + i, Y + h, o); } for (let j = 0; j < h; j++) { px(X - 1, Y + j, o); px(X + w, Y + j, o); for (let i = 0; i < w; i++) px(X + i, Y + j, C(FLAG_COL(L, (i + .5) / w, (j + .5) / h))); } }
const SHIP = {
  ferry: ['......ss......', '...wwwwwwww...', '..wkwkwkwkww..', 'hhhhhhhhhhhhhh', '.hhhhhhhhhhhh.'], freighter: ['.............ww.', '.cCcCcCcCc...wk.', '.CcCcCcCcC..www.', 'hhhhhhhhhhhhhhhh', '.rrrrrrrrrrrrrr.'], research: ['....m.......', '....m..ww...', '..wwwwwwk...', 'hhhhhhhhhhhh', '.hhhhhhhhhh.'],
  tug: ['...ss...', '..wkw...', 'hhhhhhhh', '.hhhhhh.'], sloop: ['....r.....', '...rr.....', '..rrrw....', '.rrrrww...', '....m.....', 'hhhhhhhhh.', '.hhhhhhh..'], trawler: ['...m......', '...m.ww...', '.g.m.wk...', 'hhhhhhhhhh', '.hhhhhhhh.'],
  tall: ['..w...w...w...', '.www.www.www..', '.www.www.www..', 'wwwwwwwwwwww..', '..m...m...m...', 'hhhhhhhhhhhhhh', '.hhhhhhhhhhhh.'], liner: ['.....ss..ss.......', '...wwwwwwwwwwww...', '..wkwkwkwkwkwkww..', '.wwkwkwkwkwkwkwww.', 'hhhhhhhhhhhhhhhhhh', '.hhhhhhhhhhhhhhhh.'],
  pilot: ['..ww..', '.wkw..', 'hhhhhh', '.hhhh.'], packet: ['....ss....', '..wwwwww..', '.wkwkwkww.', 'hhhhhhhhhh', '.hhhhhhhh.'],
};
/** tiny ship on the horizon; (X, Y) = pixel of the waterline centre */
export function shipPx(kind, c, X, Y, night, flip) { const m = SHIP[kind] || SHIP.tug, w = m[0].length, h = m.length, pal = { h: night ? dk(c, .55) : c, w: night ? '#3a4466' : '#f4f0e8', k: night ? '#ffd070' : '#5a86a8', s: night ? '#2a3050' : '#c8402e', m: night ? '#3a4466' : '#5a4a3a', c: night ? '#2a3458' : '#e8a23a', C: night ? '#343e60' : '#3f8fb0', r: night ? '#3a2a40' : '#c8402e', g: night ? '#3a4466' : '#6a8a5a' };
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const ch = m[j][flip ? w - 1 - i : i]; if (ch && ch !== '.' && pal[ch]) px(X - (w >> 1) + i, Y - h + 1 + j, C(pal[ch])); } if (night) { px(X, Y - h, C('#ffffff')); px(X - (w >> 1) + (flip ? w - 1 : 0), Y - 2, C(flip ? '#6aff8a' : '#ff5a4a')); } }
export const rope = (a, b, c = '#c8a878') => { lw(a, b, c); };
