// Icon drawing kit: a tiny 16x16 paint buffer with automatic 1px outline and top-left lighting,
// flushed into the current raster target with pxh(). Shared by every icon module in this folder.
//
// Usage inside an icon draw fn (always via icon(fn) so begin/flush happen):
//   R(x,y,w,h,c)   shaded rect          r(x,y,w,h,c)   flat rect
//   OV(x,y,w,h,c)  shaded oval in box   ov(...)        flat oval
//   PG(pts,c)      shaded polygon       pg(pts,c)      flat polygon (pts = pixel-corner coords)
//   ln(x0,y0,x1,y1,c) line (inclusive pixels)   p(x,y,c) pixel   spr(x,y,rows,map) pixel-art stamp
//   glyph(name,x,y,c,c2) stamp a shared mini glyph (see GLYPHS)
// Shaded shapes get a cream highlight on their top/left edge and a cool shadow on bottom/right edges.
// Every silhouette gets a 1px #2a2733 outline automatically (4-neighbour) unless drawn with soft colours (st()).
import { pxh, PW, dk, lt, mix } from '../../engine/raster.js';
export { dk, lt, mix };

export const N = 16;
export const OL = '#2a2733';
export const P = {
  ol: OL, cream: '#fff4dc', white: '#fbf7ee', paper: '#efe3c8', shade: '#d9c9a6',
  red: '#e05a3a', crimson: '#c92a2a', tomato: '#e8483a', pink: '#f28fb0', rose: '#e0608e', peach: '#f6b48a', orange: '#f08a2c', gold: '#f2c230', yellow: '#f6d24a', lemon: '#f7e35a',
  green: '#2f9e44', leaf: '#5fb84f', lime: '#a8d84a', mint: '#8fdcb4', teal: '#2fa3a0', blue: '#3b5bdb', sky: '#6fb3e0', ice: '#cfe9f4', navy: '#2c3e7a', purple: '#8a5cc2', violet: '#b07ad8',
  brown: '#9a6236', wood: '#b8794a', tan: '#d8a868', bread: '#d6924a', crust: '#a8642e', choc: '#6b3f2a', coffee: '#7a4a2e',
  grey: '#9aa0aa', steel: '#c2cad4', slate: '#5e6676', dark: '#4a4458', black: '#3a3644', skin: '#f2c49a', face: '#f6c945',
};

let G = null;
const REG = [null];
function rg(c, shade, ol = true) { REG.push({ c, shade, ol }); return REG.length - 1; }
export function begin() { G = { c: new Array(N * N).fill(null), r: new Int32Array(N * N) }; REG.length = 1; }
const inb = (x, y) => x >= 0 && y >= 0 && x < N && y < N;
function set(x, y, c, id) { x = Math.round(x); y = Math.round(y); if (!inb(x, y) || !c) return; const i = y * N + x; G.c[i] = c; G.r[i] = id; }
/** read back a pixel colour of the buffer (null = empty) */
export const get = (x, y) => inb(x, y) ? G.c[y * N + x] : null;
/** erase pixels (make transparent) */
export function clr(x, y, w = 1, h = 1) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (inb(x + i, y + j)) { G.c[(y + j) * N + x + i] = null; G.r[(y + j) * N + x + i] = 0; } }

const rectI = (x, y, w, h, c, id) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(x + i, y + j, c, id); };
const ovI = (x, y, w, h, c, id) => { const cx = x + w / 2, cy = y + h / 2, rx = w / 2, ry = h / 2; for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) { const a = (i + .5 - cx) / rx, b = (j + .5 - cy) / ry; if (a * a + b * b <= 1.08) set(i, j, c, id); } };
function inPoly(pts, X, Y) { let ins = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > Y) !== (yj > Y) && X < (xj - xi) * (Y - yi) / (yj - yi) + xi) ins = !ins; } return ins; }
const pgI = (pts, c, id) => { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (inPoly(pts, x + .5, y + .5)) set(x, y, c, id); };

/* flat primitives */
export const r = (x, y, w, h, c) => rectI(x, y, w, h, c, rg(c, false));
export const ov = (x, y, w, h, c) => ovI(x, y, w, h, c, rg(c, false));
export const pg = (pts, c) => pgI(pts, c, rg(c, false));
export const p = (x, y, c) => set(x, y, c, rg(c, false));
/** several pixels: ps([[x,y],...], c) */
export const ps = (pts, c) => { const id = rg(c, false); for (const q of pts) set(q[0], q[1], c, id); };
export function ln(x0, y0, x1, y1, c, soft) { const id = rg(c, false, !soft); let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, e = dx + dy; for (let k = 0; k < 64; k++) { set(x0, y0, c, id); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } }
/* shaded primitives */
export const R = (x, y, w, h, c) => rectI(x, y, w, h, c, rg(c, true));
export const OV = (x, y, w, h, c) => ovI(x, y, w, h, c, rg(c, true));
export const PG = (pts, c) => pgI(pts, c, rg(c, true));
/** soft (un-outlined) pixels: steam, sparkles, glows. st(pts, c) */
export const st = (pts, c) => { const id = rg(c, false, false); for (const q of pts) set(q[0], q[1], c, id); };
/** soft line (no outline) */
export const sl = (x0, y0, x1, y1, c) => ln(x0, y0, x1, y1, c, true);

/**
 * Pixel-art stamp. rows: array of strings; map: char -> hex. '.' and ' ' are transparent.
 * Upper-case map keys ending in '!' are not supported; use opts {shade:true} to edge-shade the whole stamp,
 * {soft:true} for no outline.
 */
export function spr(x, y, rows, map, o = {}) {
  const ids = {};
  for (let j = 0; j < rows.length; j++) for (let i = 0; i < rows[j].length; i++) {
    const ch = rows[j][i]; if (ch === '.' || ch === ' ') continue; const c = ch === 'o' && !map.o ? OL : map[ch]; if (!c) continue;
    const id = ids[ch] || (ids[ch] = rg(c, !!o.shade, !o.soft)); set(x + i, y + j, c, id);
  }
}

/* ---------- shared mini glyphs (stamp in one colour; '+' = second colour, 'o' = outline) ---------- */
export const GLYPHS = {
  cup: ['.......', '#####..', '#####+.', '#####.+', '#####+.', '.###...', '.......'],
  mug: ['#####..', '#####++', '#####.+', '#####.+', '#####++', '.###...'],
  cart: ['+......', '.#####.', '.#####.', '.####..', '.#.....', '.#####.', '..+..+.'],
  basket: ['..+.+..', '.+...+.', '#######', '.#.#.#.', '.#####.', '..###..'],
  shirt: ['.##.##.', '#######', '#######', '.#####.', '.#####.', '.#####.'],
  sofa: ['.#####.', '#.###.#', '#######', '#######', '+.....+'],
  lamp: ['.###.', '#####', '..+..', '..+..', '.+++.'],
  book: ['.####.', '#####+', '#####+', '#####+', '#####+', '.####+'],
  books: ['#.+..', '#.+.#', '#.+.#', '#.+.#', '#####'],
  croissant: ['..###..', '.#+#+#.', '#+#+#+#', '##...##'],
  fork: ['+.#.#', '+.###', '+..#.', '+..#.', '+..#.'],
  knifefork: ['#.#.#.+', '#.#.#.+', '#####.+', '..#..++', '..#...+', '..#...+', '..#...+'],
  bowl: ['.+.+.+.', '.+.+.+.', '#######', '.#####.', '..###..'],
  noodle: ['..#+#..', '.+.+.+.', '#######', '#######', '.#####.', '..###..'],
  pizza: ['#######', '.#+#+#.', '.##+##.', '..###..', '..#+#..', '...#...'],
  cloche: ['...+...', '..###..', '.#####.', '#######', '#######', '+++++++'],
  dumbbell: ['##...##', '##...##', '#######', '##...##', '##...##'],
  briefcase: ['..###..', '..#.#..', '#######', '#######', '###+###', '#######'],
  cross: ['..###..', '..###..', '#######', '#######', '#######', '..###..', '..###..'],
  cocktail: ['#######', '.#####.', '..###..', '...#...', '...#...', '.#####.'],
  film: ['#+#+#+#', '#######', '#.....#', '#.....#', '#######', '#+#+#+#'],
  clapper: ['#+#+#+#', '#######', '#######', '#######', '#######'],
  parcel: ['.#####.', '#######', '###+###', '###+###', '#######', '#######'],
  crate: ['#######', '#+#+#+#', '#######', '#+#+#+#', '#######'],
  bank: ['...#...', '.#####.', '#######', '.#.#.#.', '.#.#.#.', '.#.#.#.', '#######'],
  plane: ['...#...', '...#...', '.#####.', '#######', '...#...', '..###..'],
  hotdog: ['.#####.', '#+++++#', '#######', '.#####.'],
  icecream: ['.###.', '#####', '#####', '+++++', '.+++.', '..+..'],
  taco: ['..###..', '.#+#+#.', '#+#+#+#', '#######'],
  stall: ['#+#+#+#', '#+#+#+#', '.#...#.', '.#...#.', '#######', '#######'],
  bread: ['.#####.', '#######', '#+#+#+#', '#######', '.#####.'],
  leaf: ['....##', '..####', '.####.', '####..', '.#....', '#.....'],
  heart: ['.#.#.', '#####', '#####', '.###.', '..#..'],
  star: ['...#...', '..###..', '#######', '.#####.', '.##.##.', '#.....#'],
  bolt: ['..###', '.###.', '####.', '..##.', '.##..', '##...', '#....'],
  drop: ['..#..', '..#..', '.###.', '#####', '#####', '.###.'],
  note: ['..####', '..#..#', '..#..#', '..#..#', '###.##', '###.##'],
  chat: ['######.', '#######', '#######', '######.', '.#.....'],
  person: ['.##.', '####', '.##.', '####', '####', '#..#'],
  people: ['.#..+.', '###+++', '.#..+.', '###+++', '#.#+.+'],
  bus: ['#######', '#+#+#+#', '#######', '#######', '.#...#.'],
  train: ['.#####.', '#+++++#', '#######', '##.#.##', '.#####.', '#.....#'],
  car: ['..###..', '.#+#+#.', '#######', '#######', '.#...#.'],
  house: ['...#...', '..###..', '.#####.', '#######', '.##+##.', '.##+##.'],
  key: ['.##....', '#..#...', '#..####', '.##..#.', '.....#.'],
  gear: ['.#.#.#.', '#######', '.##.##.', '###.###', '.##.##.', '#######', '.#.#.#.'],
  tree: ['..###..', '.#####.', '#######', '.#####.', '...+...', '...+...'],
  duck: ['.##....', '###+...', '.##....', '.######', '.#####.', '..###..'],
  wheel: ['..###..', '.#+#+#.', '##+#+##', '#######', '##+#+##', '.#+#+#.', '..###..'],
  lighthouse: ['..+..', '.###.', '..#..', '.###.', '.#+#.', '.###.', '#####'],
  mountain: ['...#...', '..###..', '..#+##.', '.#####.', '#######'],
  swing: ['#######', '.#...#.', '.#...#.', '.#...#.', '.#+++#.', '.#...#.'],
  path: ['..##...', '...##..', '....##.', '...##..', '..##...', '.##....'],
  sprout: ['#...#', '##.##', '.###.', '..#..', '++#++', '+++++'],
  cap: ['...#...', '.#####.', '#######', '.#.#...', '.#####.'],
  fountain: ['...+...', '..+#+..', '...#...', '.#####.', '#######'],
  pin: ['.###.', '#####', '##+##', '#####', '.###.', '..#..'],
  zzz: ['####...', '..#....', '.#.###.', '####.#.', '....#..', '....###'],
  coin: ['.###.', '#+#+#', '#+#+#', '#+#+#', '.###.'],
  wrench: ['.#..#', '.##.#', '..###', '..##.', '.##..', '##...', '#....'],
  pan: ['.####...', '######..', '######..', '######++', '.####...'],
  chef: ['.#.#.', '#####', '#####', '.###.', '.###.'],
  ticket: ['#######', '#.###.#', '#######', '#.###.#', '#######'],
  shoe: ['#......', '##.....', '###....', '######.', '#######'],
  hook: ['..#..', '..#..', '..#..', '#.#..', '#.#..', '.#...'],
  steth: ['#...#', '#...#', '.#.#.', '..#..', '..#.+', '..###'],
  whistle: ['.###...', '#####..', '######+', '######.', '.####..'],
  scanner: ['#####', '#+#+#', '#####', '.##..', '.##..'],
  shaker: ['.###.', '.###.', '#####', '#####', '#####', '#####', '.###.'],
  laptop: ['.#####.', '.#+++#.', '.#+++#.', '.#####.', '#######'],
  pen: ['.....##', '....##.', '...##..', '..##...', '.##....', '+#.....'],
  dog: ['.......', '##.....', '###....', '.######', '.######', '.#...#.'],
  paper: ['####.', '#+++#', '#####', '#+++#', '#####'],
  hammer: ['####', '####', '.#..', '.#..', '.#..'],
  bolt2: ['.#.', '##.', '.##', '.#.'],
  palette: ['.####.', '#+##+#', '####.#', '#+###.', '.####.'],
  knight: ['..##.', '.####', '#####', '..###', '.###.', '#####'],
  check: ['......#', '.....##', '#...##.', '##.##..', '.###...', '..#....'],
  xmark: ['##...##', '.##.##.', '..###..', '.##.##.', '##...##'],
  sun: ['#.#.#', '.###.', '#####', '.###.', '#.#.#'],
  moon: ['.###', '##..', '#...', '##..', '.###'],
  fish: ['.###..#', '#+####.', '#######', '.###..#'],
  bubble: ['.###.', '#+..#', '#...#', '.###.'],
  calendar: ['#.#.#', '#####', '#+#+#', '#####', '#+#+#', '#####'],
  glass: ['#####', '#+++#', '#+++#', '.###.', '..#..', '.###.'],
  dancer: ['..#..', '#####', '..#..', '.#.#.', '#...#'],
  camera: ['.##....', '#######', '##+++##', '##+.+##', '##+++##', '#######'],
  phone: ['.###.', '#+++#', '#+++#', '#+++#', '#+++#', '##.##', '.###.'],
};
/** stamp a glyph; c main colour, c2 secondary (defaults to c). opts.soft: no outline */
export function glyph(name, x, y, c, c2, o = {}) {
  const g = GLYPHS[name]; if (!g) return; spr(x, y, g, { '#': c, '+': c2 || c }, o);
}
/** glyph width/height */
export const gw = name => Math.max(...GLYPHS[name].map(s => s.length));
export const gh = name => GLYPHS[name].length;
/** stamp a glyph centred in the box (x,y,w,h) */
export function glyphC(name, x, y, w, h, c, c2, o) { glyph(name, x + Math.floor((w - gw(name)) / 2), y + Math.floor((h - gh(name)) / 2), c, c2, o); }

/* ---------- flush: lighting + outline -> raster target ---------- */
export function flush() {
  const out = G.c.slice(), at = (x, y) => inb(x, y) ? G.r[y * N + x] : 0;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x, id = G.r[i]; if (!G.c[i] || !id) continue; const rr = REG[id]; if (!rr.shade || G.c[i] !== rr.c) continue;
    const outside = (X, Y) => { const n = at(X, Y); return !inb(X, Y) || !n || n < id; };
    const c = rr.c;
    if (outside(x, y - 1)) out[i] = lt(c, .38);
    else if (outside(x, y + 1)) out[i] = dk(c, .3);
    else if (outside(x - 1, y)) out[i] = lt(c, .2);
    else if (outside(x + 1, y)) out[i] = dk(c, .18);
  }
  // outline: empty pixel touching (4-neigh) an outlined, non-outline-coloured pixel
  const solid = (X, Y) => { if (!inb(X, Y)) return false; const i = Y * N + X; return G.c[i] && G.c[i] !== OL && REG[G.r[i]] && REG[G.r[i]].ol; };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x; if (G.c[i]) continue;
    if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) out[i] = OL;
  }
  const o = PW(0, 0, 0), ox = Math.round(o[0]), oy = Math.round(o[1]);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const c = out[y * N + x]; if (c) pxh(ox + x, oy + y, c); }
  G = null;
}
/** wrap a body fn into a complete icon draw fn */
export const icon = body => () => { begin(); try { body(); } finally { flush(); } };

/* ---------- shared shapes used across modules ---------- */
/** steam wisps above (x..), soft */
export function steam(x, y, c = '#e8eef4') { st([[x, y + 2], [x + 1, y + 1], [x, y], [x + 3, y + 3], [x + 4, y + 2], [x + 3, y + 1]], c); }
/** sparkle (soft 4-point star) centred at x,y */
export function sparkle(x, y, c = '#fff8e0') { st([[x, y], [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]], c); }
/** small leaf pair at x,y */
export function leafs(x, y, c = P.leaf) { ps([[x, y], [x + 1, y], [x + 1, y - 1], [x + 2, y - 1], [x - 1, y - 1], [x - 2, y - 1], [x - 1, y]], c); }
